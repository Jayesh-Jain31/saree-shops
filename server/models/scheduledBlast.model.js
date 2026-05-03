import mongoose from 'mongoose'

const scheduledBlastSchema = new mongoose.Schema({
    couponCode:  { type: String, required: true },
    message:     { type: String, required: true },
    scheduledAt: { type: Date,   required: true },
    status:      { type: String, enum: ['pending', 'sending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    sentAt:      { type: Date,   default: null },
    sentCount:   { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note:        { type: String, default: '' },
}, { timestamps: true })

const ScheduledBlastModel = mongoose.model('ScheduledBlast', scheduledBlastSchema)
export default ScheduledBlastModel
