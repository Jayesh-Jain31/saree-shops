import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    type:    { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
    link:    { type: String, default: '' },
    read:    { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ userId: 1, createdAt: -1 })

const NotificationModel = mongoose.model('Notification', notificationSchema)
export default NotificationModel
