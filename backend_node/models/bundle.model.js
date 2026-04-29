import mongoose from 'mongoose'

const bundleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    label: { type: String, default: 'Bundle Deal' },
    products: [
        {
            productId: { type: mongoose.Schema.ObjectId, ref: 'product', required: true },
            quantity: { type: Number, default: 1 }
        }
    ],
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        default: 'percentage'
    },
    discountValue: { type: Number, default: 10 },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true })

const BundleModel = mongoose.model('Bundle', bundleSchema)
export default BundleModel
