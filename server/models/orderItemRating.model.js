import mongoose from "mongoose";

const orderItemRatingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.ObjectId, ref: 'order', required: true },
    productId: { type: mongoose.Schema.ObjectId, ref: 'product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true })

orderItemRatingSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true })

const OrderItemRatingModel = mongoose.model('orderItemRating', orderItemRatingSchema)

export default OrderItemRatingModel
