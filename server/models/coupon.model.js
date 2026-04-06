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
        enum: ['percentage', 'flat', 'free_shipping', 'first_order'],
        default: 'percentage',
    },
    discountValue: {
        type: Number,
        default: 0,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    maxDiscount: {
        type: Number,
        default: null,
    },
    usageLimit: {
        type: Number,
        default: null,
    },
    usageCount: {
        type: Number,
        default: 0,
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
