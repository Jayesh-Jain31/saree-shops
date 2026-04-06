import mongoose from "mongoose"

const returnSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'order',
        required: true
    },
    orderDisplayId: {
        type: String
    },
    items: [
        {
            productId: { type: mongoose.Schema.ObjectId, ref: 'product' },
            product_details: { name: String, image: Array },
            quantity: { type: Number, default: 1 },
            price: { type: Number, default: 0 }
        }
    ],
    reason: {
        type: String,
        required: true,
        enum: [
            'Damaged / Defective product',
            'Wrong item delivered',
            'Item not as described',
            'Missing items in order',
            'Changed my mind',
            'Other'
        ]
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Pick Up Scheduled', 'Rejected', 'Refund Initiated', 'Refunded'],
        default: 'Pending'
    },
    adminNote: {
        type: String,
        default: ''
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    totalAmt: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: ''
    },
    paymentId: {
        type: String,
        default: ''
    }
}, { timestamps: true })

const ReturnModel = mongoose.model('Return', returnSchema)
export default ReturnModel
