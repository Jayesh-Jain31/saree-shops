import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true })

const ReviewModel = mongoose.model('review', reviewSchema)

export default ReviewModel
