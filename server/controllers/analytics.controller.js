import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import WalletModel from "../models/wallet.model.js";
import ReturnModel from "../models/return.model.js";
import sendEmail from "../config/sendEmail.js";
import orderStatusTemplate from "../utils/orderStatusTemplate.js";
import { createNotification } from '../utils/notificationHelper.js'
import { sendOrderStatusWhatsApp, sendFreeTextWhatsApp } from "../utils/whatsapp.js";

export async function getAnalyticsController(request, response) {
    try {
        const totalOrders = await OrderModel.countDocuments()
        const totalProducts = await ProductModel.countDocuments()
        const totalUsers = await UserModel.countDocuments()

        const revenueAgg = await OrderModel.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmt' } } }
        ])
        const totalRevenue = revenueAgg[0]?.total || 0

        const statusCounts = await OrderModel.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ])

        const paymentCounts = await OrderModel.aggregate([
            { $group: { _id: '$payment_status', count: { $sum: 1 } } }
        ])

        const recentOrders = await OrderModel.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email')
            .populate('delivery_address')

        const monthlyRevenue = await OrderModel.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ])

        const topProducts = await OrderModel.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product_details.name',
                    totalQty: { $sum: '$items.quantity' },
                    image: { $first: '$items.product_details.image' }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 }
        ])

        return response.json({
            message: "Analytics data",
            data: {
                totalOrders,
                totalProducts,
                totalUsers,
                totalRevenue,
                statusCounts,
                paymentCounts,
                recentOrders,
                monthlyRevenue,
                topProducts,
            },
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getAllOrdersAdminController(request, response) {
    try {
        const { page = 1, limit = 20, status, search } = request.body

        const filter = {}
        if (status && status !== 'all') {
            filter.orderStatus = status
        }
        if (search) {
            filter.orderId = { $regex: search, $options: 'i' }
        }

        const totalCount = await OrderModel.countDocuments(filter)
        const orders = await OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('delivery_address')

        return response.json({
            message: "All orders",
            data: { orders, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page },
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getOrderDetailAdminController(request, response) {
    try {
        const { orderId } = request.query
        const order = await OrderModel.findById(orderId)
            .populate('userId', 'name email mobile avatar')
            .populate('delivery_address')
        if (!order) return response.status(404).json({ message: "Order not found", error: true, success: false })
        return response.json({ data: order, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function updateOrderStatusAdminController(request, response) {
    try {
        const { orderId, status } = request.body

        const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
        if (!validStatuses.includes(status)) {
            return response.status(400).json({ message: "Invalid status", error: true, success: false })
        }

        const updateData = { orderStatus: status }
        if (status === 'Delivered') updateData.deliveredAt = new Date()
        const order = await OrderModel.findByIdAndUpdate(orderId, updateData, { new: true })
        if (!order) {
            return response.status(404).json({ message: "Order not found", error: true, success: false })
        }

        // Send email + WhatsApp notification to customer
        try {
            const user = await UserModel.findById(order.userId).select('name email mobile')
            if (user?.email) {
                await sendEmail({
                    sendTo: user.email,
                    subject: `Order ${status} - ${order.orderId}`,
                    html: orderStatusTemplate({
                        orderId: order.orderId,
                        status,
                        customerName: user.name,
                        totalAmt: order.totalAmt
                    })
                })
            }
            if (user?.mobile) {
                sendOrderStatusWhatsApp({
                    mobile: user.mobile,
                    name: user.name,
                    orderId: order.orderId,
                    status,
                    totalAmt: order.totalAmt,
                }).catch(() => {})
            }
        } catch (emailErr) {
            console.log('Order status email failed:', emailErr.message)
        }

        const statusMsgMap = {
            'Confirmed':        `Your order ${order.orderId} has been confirmed! ✅`,
            'Shipped':          `Your order ${order.orderId} has been shipped! 🚚`,
            'Out for Delivery': `Your order ${order.orderId} is out for delivery! 📦`,
            'Delivered':        `Your order ${order.orderId} has been delivered! 🎉`,
            'Cancelled':        `Your order ${order.orderId} has been cancelled.`,
        }
        if (statusMsgMap[status]) {
            createNotification(order.userId, statusMsgMap[status], status === 'Cancelled' ? 'warning' : 'success', '/dashboard/myorders').catch(() => {})
        }

        return response.json({ message: "Order status updated", data: order, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getCustomerDetailAdmin(request, response) {
    try {
        const { userId } = request.params
        const user = await UserModel.findById(userId).select('-password -refresh_token -forgot_password_otp')
        if (!user) return response.status(404).json({ message: 'Customer not found', error: true, success: false })

        const [totalOrders, deliveredOrders, cancelledOrders, spentAgg, recentOrders, wallet] = await Promise.all([
            OrderModel.countDocuments({ userId }),
            OrderModel.countDocuments({ userId, orderStatus: 'Delivered' }),
            OrderModel.countDocuments({ userId, orderStatus: 'Cancelled' }),
            OrderModel.aggregate([
                { $match: { userId: user._id, orderStatus: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmt' } } }
            ]),
            OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(15).select('orderId orderStatus totalAmt createdAt payment_status items'),
            WalletModel.findOne({ userId })
        ])

        return response.json({
            success: true, error: false,
            data: {
                user,
                stats: { totalOrders, deliveredOrders, cancelledOrders, totalSpent: spentAgg[0]?.total || 0 },
                recentOrders,
                wallet: wallet || { balance: 0, transactions: [] }
            }
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function toggleCustomerCOD(request, response) {
    try {
        const { userId } = request.params
        const user = await UserModel.findById(userId)
        if (!user) return response.status(404).json({ message: 'Customer not found', error: true, success: false })
        user.codRestricted = !user.codRestricted
        await user.save()
        return response.json({
            success: true, error: false,
            message: user.codRestricted ? 'COD disabled for this customer' : 'COD enabled for this customer',
            data: { codRestricted: user.codRestricted }
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function updateCustomerStatus(request, response) {
    try {
        const { userId } = request.params
        const { status } = request.body
        const validStatuses = ['Active', 'Inactive', 'Suspended']
        if (!validStatuses.includes(status)) return response.status(400).json({ message: 'Invalid status', error: true, success: false })
        const user = await UserModel.findByIdAndUpdate(userId, { status }, { new: true }).select('-password -refresh_token')
        if (!user) return response.status(404).json({ message: 'Customer not found', error: true, success: false })
        return response.json({ success: true, error: false, message: `Account status set to ${status}`, data: user })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function adminWalletAdjust(request, response) {
    try {
        const { userId } = request.params
        const { type, amount, description } = request.body
        if (!['credit', 'debit'].includes(type) || !amount || amount <= 0) {
            return response.status(400).json({ message: 'Invalid wallet adjustment', error: true, success: false })
        }
        let wallet = await WalletModel.findOne({ userId })
        if (!wallet) wallet = await WalletModel.create({ userId, balance: 0, transactions: [] })
        if (type === 'debit' && wallet.balance < amount) {
            return response.status(400).json({ message: 'Insufficient wallet balance', error: true, success: false })
        }
        wallet.balance = type === 'credit' ? wallet.balance + amount : wallet.balance - amount
        wallet.transactions.unshift({ type, amount, description: description || `Admin ${type}`, reference: 'ADMIN', balanceAfter: wallet.balance })
        await wallet.save()
        return response.json({ success: true, error: false, message: `Wallet ${type}ed ₹${amount}`, data: wallet })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Return reason analytics ─────────────────────────────────────────────────
export async function getReturnAnalyticsController(request, response) {
    try {
        const [reasons, statuses, recent, monthlyReturns] = await Promise.all([
            ReturnModel.aggregate([
                { $group: { _id: '$reason', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ReturnModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            ReturnModel.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'name email')
                .populate('orderId', 'orderId totalAmt')
                .lean(),
            ReturnModel.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ])
        ])
        const totalReturns = reasons.reduce((sum, r) => sum + r.count, 0)
        return response.json({ data: { reasons, statuses, recent, monthlyReturns, totalReturns }, success: true, error: false })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── WhatsApp broadcast to all customers ─────────────────────────────────────
export async function whatsappBroadcastController(request, response) {
    try {
        const { message } = request.body
        if (!message?.trim()) return response.status(400).json({ message: 'Message required', error: true, success: false })

        const users = await UserModel.find({ mobile: { $ne: null }, status: 'Active' }).select('mobile name').lean()
        let sent = 0, failed = 0
        for (const user of users) {
            try {
                await sendFreeTextWhatsApp(user.mobile, message.trim())
                sent++
                await new Promise(r => setTimeout(r, 120))
            } catch { failed++ }
        }
        return response.json({ message: `Broadcast done: ${sent} sent, ${failed} failed`, data: { sent, failed }, success: true, error: false })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Loyalty tier helper ──────────────────────────────────────────────────────
export function getLoyaltyTier(totalSpent) {
    if (totalSpent >= 15000) return { tier: 'Gold', color: '#f59e0b', next: null, nextAt: null }
    if (totalSpent >= 5000) return { tier: 'Silver', color: '#94a3b8', next: 'Gold', nextAt: 15000 }
    return { tier: 'Bronze', color: '#cd7c2f', next: 'Silver', nextAt: 5000 }
}

// ─── Customer loyalty tier ────────────────────────────────────────────────────
export async function getCustomerLoyaltyController(request, response) {
    try {
        const userId = request.userId
        const spentAgg = await OrderModel.aggregate([
            { $match: { userId: (await import('mongoose')).default.Types.ObjectId.createFromHexString(userId), orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmt' } } }
        ])
        const totalSpent = spentAgg[0]?.total || 0
        const loyalty = getLoyaltyTier(totalSpent)
        return response.json({ data: { totalSpent, ...loyalty }, success: true, error: false })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Referral info for current user ──────────────────────────────────────────
export async function getReferralInfoController(request, response) {
    try {
        const userId = request.userId
        const user = await UserModel.findById(userId).select('referralCode referredBy name').lean()
        if (!user) return response.status(404).json({ message: 'User not found', error: true, success: false })
        const referralCount = await UserModel.countDocuments({ referredBy: user._id })
        return response.json({ data: { referralCode: user.referralCode, referralCount }, success: true, error: false })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Abandoned Cart Recovery ──────────────────────────────────────────────────
export async function abandonedCartRecoveryController(request, response) {
    try {
        const { hoursThreshold = 2, customMessage = '' } = request.body
        const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
        const recentOrderCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const CartProductModel = (await import('../models/cartproduct.model.js')).default

        const abandonedCarts = await CartProductModel.aggregate([
            { $match: { updatedAt: { $lt: cutoff } } },
            { $group: { _id: '$userId', itemCount: { $sum: 1 }, lastUpdated: { $max: '$updatedAt' } } }
        ])

        if (!abandonedCarts.length) {
            return response.json({ message: 'No abandoned carts found', data: { notified: 0, skipped: 0, failed: 0 }, error: false, success: true })
        }

        const recentOrderUserIds = (await OrderModel.distinct('userId', { createdAt: { $gt: recentOrderCutoff } })).map(String)

        let notified = 0, skipped = 0, failed = 0

        for (const cart of abandonedCarts) {
            if (recentOrderUserIds.includes(String(cart._id))) { skipped++; continue }

            const user = await UserModel.findById(cart._id).select('name email mobile').lean()
            if (!user) { skipped++; continue }

            const msg = customMessage
                ? customMessage.replace('{{name}}', user.name || 'there').replace('{{items}}', cart.itemCount)
                : `Hi ${user.name || 'there'}, you left ${cart.itemCount} item${cart.itemCount > 1 ? 's' : ''} in your cart! Complete your order before they sell out. 🛍️`

            let sent = false
            if (user.mobile) {
                try { await sendFreeTextWhatsApp(user.mobile, msg); sent = true } catch {}
            }
            if (user.email) {
                try {
                    await sendEmail({ sendTo: user.email, subject: 'You left something in your cart!', html: `<p>${msg}</p>` })
                    sent = true
                } catch {}
            }
            sent ? notified++ : failed++
            await new Promise(r => setTimeout(r, 100))
        }

        return response.json({
            message: `Recovery run complete: ${notified} notified, ${skipped} skipped, ${failed} failed`,
            data: { total: abandonedCarts.length, notified, skipped, failed },
            error: false, success: true
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Abandoned Cart Stats ─────────────────────────────────────────────────────
export async function abandonedCartStatsController(request, response) {
    try {
        const { hoursThreshold = 2 } = request.query
        const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
        const CartProductModel = (await import('../models/cartproduct.model.js')).default

        const agg = await CartProductModel.aggregate([
            { $match: { updatedAt: { $lt: cutoff } } },
            { $group: { _id: '$userId', itemCount: { $sum: 1 } } },
            { $count: 'total' }
        ])
        const total = agg[0]?.total || 0
        return response.json({ data: { total, hoursThreshold }, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
