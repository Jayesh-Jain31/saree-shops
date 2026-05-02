import NotificationModel from '../models/notification.model.js'

export async function getMyNotifications(req, res) {
    try {
        const userId = req.userId
        const notifications = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean()
        const unreadCount = notifications.filter(n => !n.read).length
        return res.json({ success: true, data: { notifications, unreadCount } })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function markOneRead(req, res) {
    try {
        const { id } = req.params
        await NotificationModel.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { read: true }
        )
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function markAllRead(req, res) {
    try {
        await NotificationModel.updateMany({ userId: req.userId, read: false }, { read: true })
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function clearAll(req, res) {
    try {
        await NotificationModel.deleteMany({ userId: req.userId })
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function deleteOne(req, res) {
    try {
        const { id } = req.params
        await NotificationModel.findOneAndDelete({ _id: id, userId: req.userId })
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}
