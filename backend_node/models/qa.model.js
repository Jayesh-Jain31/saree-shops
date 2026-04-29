import mongoose from 'mongoose'

const qaSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        default: null
    },
    answeredAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

qaSchema.index({ productId: 1, createdAt: -1 })

const QAModel = mongoose.model('QA', qaSchema)
export default QAModel
