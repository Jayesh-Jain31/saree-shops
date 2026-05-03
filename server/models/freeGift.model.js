import mongoose from 'mongoose'

const freeGiftSchema = new mongoose.Schema({
    productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'product', default: null },
    customGift: {
        name:  { type: String, default: '' },
        image: { type: String, default: '' },
        price: { type: Number, default: 0 },
    },
    title:          { type: String, default: 'Free Gift with your order!' },
    minOrderAmount: { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },
    startDate:      { type: Date, default: null },
    endDate:        { type: Date, default: null },
}, { timestamps: true })

const FreeGiftModel = mongoose.model('FreeGift', freeGiftSchema)
export default FreeGiftModel
