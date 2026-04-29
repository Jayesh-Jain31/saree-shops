import mongoose from 'mongoose'

const loyaltySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    totalRedeemed: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ['earned', 'redeemed', 'expired', 'bonus', 'deducted'],
                required: true
            },
            points: { type: Number, required: true },
            description: { type: String, default: '' },
            reference: { type: String, default: '' },
            balanceAfter: { type: Number, default: 0 },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true })

loyaltySchema.index({ userId: 1 })

const LoyaltyModel = mongoose.model('Loyalty', loyaltySchema)
export default LoyaltyModel
