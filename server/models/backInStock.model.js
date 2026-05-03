import mongoose from 'mongoose'

const backInStockSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    mobile:    { type: String, default: null },
    email:     { type: String, default: null },
    notified:  { type: Boolean, default: false },
    notifiedAt:{ type: Date, default: null },
}, { timestamps: true })

backInStockSchema.index({ productId: 1, userId: 1 }, { unique: true, sparse: true })
backInStockSchema.index({ productId: 1, notified: 1 })

const BackInStockModel = mongoose.model('BackInStock', backInStockSchema)
export default BackInStockModel
