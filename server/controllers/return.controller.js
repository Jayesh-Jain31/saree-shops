import ReturnModel from "../models/return.model.js"
import OrderModel from "../models/order.model.js"
import WalletModel from "../models/wallet.model.js"
import Razorpay from "../config/razorpay.js"

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
    return wallet
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

        if (newStatus === 'Approved' && prevStatus !== 'Approved') {
            const order = await OrderModel.findById(returnReq.orderId)
            const isCOD = returnReq.paymentMethod === 'COD' ||
                order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY'

            if (isCOD) {
                try {
                    await creditWalletInternal(
                        returnReq.userId,
                        finalRefundAmount,
                        `Refund for order ${returnReq.orderDisplayId}`,
                        `RET-${returnReq._id}`
                    )
                    returnReq.status = 'Refunded'
                    returnReq.refundAmount = finalRefundAmount
                    autoAction = 'wallet_credited'
                } catch (e) {
                    if(process.env.NODE_ENV !== 'production') console.log('Wallet credit failed:', e.message)
                }
            } else {
                const paymentId = returnReq.paymentId || order?.paymentId
                if (paymentId && Razorpay) {
                    try {
                        await Razorpay.payments.refund(paymentId, {
                            amount: Math.round(finalRefundAmount * 100)
                        })
                        returnReq.status = 'Refund Initiated'
                        autoAction = 'razorpay_refund_initiated'
                    } catch (e) {
                        if(process.env.NODE_ENV !== 'production') console.log('Razorpay refund failed:', e.message)
                        autoAction = 'razorpay_refund_failed'
                    }
                } else {
                    returnReq.status = 'Refund Initiated'
                    autoAction = 'manual_refund_needed'
                }
            }
        }

        if (newStatus === 'Refunded' && prevStatus !== 'Refunded') {
            const order = await OrderModel.findById(returnReq.orderId)
            const isCOD = returnReq.paymentMethod === 'COD' ||
                order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY'

            if (isCOD && autoAction !== 'wallet_credited') {
                try {
                    await creditWalletInternal(
                        returnReq.userId,
                        finalRefundAmount,
                        `Refund for order ${returnReq.orderDisplayId}`,
                        `RET-${returnReq._id}`
                    )
                    autoAction = 'wallet_credited'
                } catch (e) {
                    if(process.env.NODE_ENV !== 'production') console.log('Wallet credit failed:', e.message)
                }
            }
        }

        await returnReq.save()

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
