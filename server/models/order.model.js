import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    orderId: {
        type: String,
        required: [true, "Provide orderId"],
        unique: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.ObjectId,
                ref: "product"
            },
            product_details: {
                name: String,
                image: Array,
            },
            quantity: {
                type: Number,
                default: 1
            },
            price: {
                type: Number,
                default: 0
            }
        }
    ],
    paymentId: {
        type: String,
        default: ""
    },
    payment_status: {
        type: String,
        default: ""
    },
    delivery_address: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    subTotalAmt: {
        type: Number,
        default: 0
    },
    totalAmt: {
        type: Number,
        default: 0
    },
    discountAmt: {
        type: Number,
        default: 0
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    invoice_receipt: {
        type: String,
        default: ""
    },
    shiprocketOrderId: {
        type: String,
        default: ""
    },
    shipmentId: {
        type: String,
        default: ""
    },
    awbCode: {
        type: String,
        default: ""
    },
    deliveredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel
