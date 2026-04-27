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
    delivery_address_snapshot: {
        name:         { type: String, default: '' },
        mobile:       { type: String, default: '' },
        address_line: { type: String, default: '' },
        city:         { type: String, default: '' },
        state:        { type: String, default: '' },
        pincode:      { type: String, default: '' },
        country:      { type: String, default: '' },
        landmark:     { type: String, default: '' },
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
    couponCode: {
        type: String,
        default: ""
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    walletDeduction: {
        type: Number,
        default: 0
    },
    loyaltyPointsUsed: {
        type: Number,
        default: 0
    },
    loyaltyDiscount: {
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

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ orderId: 1 })

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel
