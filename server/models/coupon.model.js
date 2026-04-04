import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Provide coupon code"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        default: 'percentage',
    },
    discountValue: {
        type: Number,
        required: [true, "Provide discount value"],
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    maxDiscount: {
        type: Number,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true })

const CouponModel = mongoose.model('coupon', couponSchema)

export default CouponModel
