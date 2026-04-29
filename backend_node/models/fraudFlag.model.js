import mongoose from 'mongoose'

const fraudFlagSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['order', 'user'],
        required: true
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        default: null
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    riskScore: {
        type: Number,
        default: 0
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    reasons: [{ type: String }],
    status: {
        type: String,
        enum: ['flagged', 'cleared', 'blocked'],
        default: 'flagged'
    },
    snapshot: {
        type: Object,
        default: {}
    },
    reviewedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    reviewNote: {
        type: String,
        default: ''
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

const FraudFlagModel = mongoose.model('FraudFlag', fraudFlagSchema)
export default FraudFlagModel
