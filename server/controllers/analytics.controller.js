import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import sendEmail from "../config/sendEmail.js";
import orderStatusTemplate from "../utils/orderStatusTemplate.js";
import { sendOrderStatusWhatsApp } from "../utils/whatsapp.js";

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

        return response.json({ message: "Order status updated", data: order, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
