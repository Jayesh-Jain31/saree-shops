import ReturnModel from "../models/return.model.js"
import OrderModel from "../models/order.model.js"

export const createReturnRequest = async (req, res) => {
    try {
        const userId = req.userId
        const { orderId, reason, description } = req.body

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

        const returnReq = await ReturnModel.create({
            userId,
            orderId,
            orderDisplayId: order.orderId,
            items: order.items,
            reason,
            description: description || '',
            totalAmt: order.totalAmt
        })

        return res.status(201).json({ message: "Return request submitted successfully", data: returnReq, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const getMyReturns = async (req, res) => {
    try {
        const userId = req.userId
        const returns = await ReturnModel.find({ userId }).sort({ createdAt: -1 })
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

        const updated = await ReturnModel.findByIdAndUpdate(returnId, {
            ...(status && { status }),
            ...(adminNote !== undefined && { adminNote }),
            ...(refundAmount !== undefined && { refundAmount })
        }, { new: true })

        if (!updated) return res.status(404).json({ message: "Return request not found", error: true, success: false })

        return res.json({ message: "Return request updated", data: updated, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}
