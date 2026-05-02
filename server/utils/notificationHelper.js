import NotificationModel from '../models/notification.model.js'

export const createNotification = async (userId, message, type = 'info', link = '') => {
    try {
        if (!userId) return
        await NotificationModel.create({ userId, message, type, link })
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message)
    }
}
