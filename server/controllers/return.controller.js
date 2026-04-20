import ReturnModel from "../models/return.model.js"
import OrderModel from "../models/order.model.js"
import WalletModel from "../models/wallet.model.js"
import Razorpay from "../config/razorpay.js"
import UserModel from "../models/user.model.js"
import SettingModel from "../models/settings.model.js"
import { sendReturnStatusWhatsApp, sendAdminNewReturnAlert } from "../utils/whatsapp.js"

const creditWalletInternal = async (userId, amount, description, reference) => {
    let wallet = await WalletModel.findOne({ userId })
    if (!wallet) wallet = await WalletModel.create({ userId, balance: 0, transactions: [] })
    wallet.balance += amount
    wallet.transactions.unshift({
        type: 'credit',
        amount,
        description,
        reference: reference || '',
        balanceAfter: wallet.balance
    })
    await wallet.save()
}

const triggerRazorpayRefund = async (paymentId, amountRupees, label) => {
    if (!paymentId || !Razorpay) {
        console.warn(`[Refund] Cannot trigger — paymentId: ${paymentId}, Razorpay configured: ${!!Razorpay}`)
        return { success: false, error: 'No paymentId or Razorpay not configured' }
    }
    try {
        const rzRefund = await Razorpay.payments.refund(paymentId, {
            amount: Math.round(amountRupees * 100),
            speed: "normal",
            notes: { reason: label }
        })
        console.log(`[Refund] Razorpay OK — refundId: ${rzRefund?.id}, label: ${label}, amount: ₹${amountRupees}`)
        return { success: true, refundId: rzRefund?.id }
    } catch (e) {
        const errMsg = e?.error?.description || e?.message || String(e)
        console.error(`[Refund] Razorpay FAILED — label: ${label}, paymentId: ${paymentId}, amount: ₹${amountRupees}, error: ${errMsg}`)
        console.error(`[Refund] Full error:`, JSON.stringify(e?.error || e))
        return { success: false, error: errMsg }
    }
}

export const createReturnRequest = async (req, res) => {
    try {
        const userId = req.userId
        const { orderId, reason, description, selectedItems, images } = req.body

        if (!orderId || !reason) {
            return res.status(400).json({ message: "orderId and reason are required", error: true, success: false })
        }

        const order = await OrderModel.findById(orderId)
        if (!order) return res.status(404).json({ message: "Order not found", error: true, success: false })
        if (String(order.userId) !== String(userId)) {
            return res.status(403).json({ message: "Not authorized", error: true, success: false })
        }
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ message: "Returns can only be requested for delivered orders", error: true, success: false })
        }

        const existing = await ReturnModel.findOne({ orderId, userId })
        if (existing) {
            return res.status(400).json({ message: "Return request already submitted for this order", error: true, success: false })
        }

        const isCOD = order.payment_status?.toUpperCase() === 'CASH ON DELIVERY'

        let returnItems = order.items
        if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
            const selectedIds = new Set(selectedItems.map(id => String(id)))
            returnItems = order.items.filter(item => selectedIds.has(String(item.productId)))
            if (returnItems.length === 0) returnItems = order.items
        }

        const returnTotalAmt = returnItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)

        const returnReq = await ReturnModel.create({
            userId,
            orderId,
            orderDisplayId: order.orderId,
            items: returnItems,
            reason,
            description: description || '',
            images: Array.isArray(images) ? images.filter(Boolean) : [],
            totalAmt: returnItems.length === order.items.length ? order.totalAmt : returnTotalAmt,
            paymentMethod: isCOD ? 'COD' : 'ONLINE',
            paymentId: order.paymentId || ''
        })

        try {
            const user = await UserModel.findById(userId).select('name mobile')
            SettingModel.findOne({ key: 'admin_whatsapp_number' }).then(setting => {
                if (setting?.value) {
                    sendAdminNewReturnAlert(setting.value, {
                        orderId: order.orderId,
                        customerName: user?.name,
                        customerMobile: user?.mobile,
                        reason,
                        totalAmt: returnReq.totalAmt
                    }).catch(() => {})
                }
            }).catch(() => {})
        } catch {}

        return res.status(201).json({ message: "Return request submitted successfully", data: returnReq, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const getMyReturns = async (req, res) => {
    try {
        const userId = req.userId
        const returns = await ReturnModel.find({ userId })
            .populate({
                path: 'orderId',
                select: 'payment_status paymentId delivery_address subTotalAmt totalAmt orderId orderStatus',
                populate: {
                    path: 'delivery_address',
                    model: 'address'
                }
            })
            .sort({ createdAt: -1 })
        return res.json({ data: returns, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const getReturnByOrderId = async (req, res) => {
    try {
        const userId = req.userId
        const { orderId } = req.params
        const ret = await ReturnModel.findOne({ orderId, userId })
        return res.json({ data: ret || null, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const getAllReturnsAdmin = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query
        const filter = status && status !== 'all' ? { status } : {}
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [returns, total] = await Promise.all([
            ReturnModel.find(filter).populate('userId', 'name email mobile').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            ReturnModel.countDocuments(filter)
        ])
        return res.json({ data: returns, total, page: parseInt(page), error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const updateReturnStatus = async (req, res) => {
    try {
        const { returnId } = req.params
        const { status, adminNote, refundAmount } = req.body

        const returnReq = await ReturnModel.findById(returnId)
        if (!returnReq) return res.status(404).json({ message: "Return request not found", error: true, success: false })

        const prevStatus = returnReq.status
        const newStatus = status || prevStatus
        const finalRefundAmount = parseFloat(refundAmount) || returnReq.totalAmt

        returnReq.status = newStatus
        if (adminNote !== undefined) returnReq.adminNote = adminNote
        if (refundAmount !== undefined) returnReq.refundAmount = finalRefundAmount

        let autoAction = null

        // Trigger refund on Approved (fresh) OR Refund Initiated (admin retrying a stuck return)
        const shouldTriggerRefund =
            (newStatus === 'Approved' && prevStatus !== 'Approved') ||
            (newStatus === 'Refund Initiated' && prevStatus === 'Approved')

        if (shouldTriggerRefund) {
            const order = await OrderModel.findById(returnReq.orderId)
            const isCOD = returnReq.paymentMethod === 'COD' ||
                (order?.payment_status || '').toUpperCase().includes('CASH') ||
                (order?.payment_status || '').toUpperCase() === 'COD' ||
                !order?.paymentId

            if (isCOD) {
                // COD: auto-credit wallet immediately
                try {
                    await creditWalletInternal(
                        returnReq.userId,
                        finalRefundAmount,
                        `Refund for return on order ${returnReq.orderDisplayId}`,
                        `RET-${returnReq._id}`
                    )
                    returnReq.status = 'Refunded'
                    returnReq.refundAmount = finalRefundAmount
                    autoAction = 'wallet_credited'
                    console.log(`[Refund] Wallet credited ₹${finalRefundAmount} for COD return ${returnReq._id}`)
                } catch (e) {
                    console.error('[Refund] Wallet credit failed:', e.message)
                }
            } else {
                // Online payment: trigger Razorpay refund automatically
                const paymentId = returnReq.paymentId || order?.paymentId
                returnReq.status = 'Refund Initiated'
                returnReq.refundAmount = finalRefundAmount

                const rzResult = await triggerRazorpayRefund(
                    paymentId,
                    finalRefundAmount,
                    `Return approved for order ${returnReq.orderDisplayId}`
                )
                autoAction = rzResult.success ? 'razorpay_refund_initiated' : 'razorpay_refund_failed'
            }
        }

        if (newStatus === 'Refunded' && prevStatus !== 'Refunded' && autoAction !== 'wallet_credited') {
            const order = await OrderModel.findById(returnReq.orderId)
            const isCOD = returnReq.paymentMethod === 'COD' ||
                (order?.payment_status || '').toUpperCase().includes('CASH') ||
                !order?.paymentId

            if (isCOD) {
                try {
                    await creditWalletInternal(
                        returnReq.userId,
                        finalRefundAmount,
                        `Refund for return on order ${returnReq.orderDisplayId}`,
                        `RET-${returnReq._id}`
                    )
                    autoAction = 'wallet_credited'
                } catch (e) {
                    console.error('[Refund] Wallet credit failed:', e.message)
                }
            }
        }

        await returnReq.save()

        // WhatsApp notification for return status update
        try {
            const retUser = await UserModel.findById(returnReq.userId).select('name mobile')
            if (retUser?.mobile && returnReq.status !== prevStatus) {
                sendReturnStatusWhatsApp({
                    mobile: retUser.mobile,
                    name: retUser.name,
                    orderId: returnReq.orderDisplayId,
                    status: returnReq.status,
                    refundAmount: returnReq.refundAmount,
                    paymentMethod: returnReq.paymentMethod,
                }).catch(() => {})
            }
        } catch {}

        return res.json({
            message: autoAction === 'wallet_credited'
                ? `Refund of ₹${finalRefundAmount} credited to customer wallet`
                : autoAction === 'razorpay_refund_initiated'
                    ? `Razorpay refund initiated for ₹${finalRefundAmount}`
                    : "Return request updated",
            data: returnReq,
            autoAction,
            error: false,
            success: true
        })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}
