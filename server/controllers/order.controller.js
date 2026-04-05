import Razorpay from "../config/razorpay.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import crypto from "crypto";

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId
        const { list_items, totalAmt, addressId, subTotalAmt, discountAmt = 0 } = request.body

        const items = list_items.map(el => ({
            productId: el.productId._id,
            product_details: {
                name: el.productId.name,
                image: el.productId.image
            },
            quantity: el.quantity || 1,
            price: el.productId.price || 0,
        }))

        const order = await OrderModel.create({
            userId: userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            items: items,
            paymentId: "",
            payment_status: "CASH ON DELIVERY",
            delivery_address: addressId,
            subTotalAmt: subTotalAmt,
            totalAmt: totalAmt,
            discountAmt: discountAmt,
            orderStatus: "Confirmed",
        })

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })

        return response.json({
            message: "Order placed successfully",
            error: false,
            success: true,
            data: order
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const pricewithDiscount = (price, dis = 1) => {
    const discountAmout = Math.ceil((Number(price) * Number(dis)) / 100)
    const actualPrice = Number(price) - Number(discountAmout)
    return actualPrice
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export async function razorpayOrderController(request, response) {
    try {
        const { totalAmt } = request.body

        if (!totalAmt || totalAmt <= 0) {
            return response.status(400).json({
                message: "Invalid order amount",
                error: true,
                success: false
            })
        }

        const options = {
            amount: Math.round(totalAmt * 100),
            currency: "INR",
            receipt: `receipt_${new mongoose.Types.ObjectId()}`,
        }

        const razorpayOrder = await Razorpay.orders.create(options)

        return response.status(200).json({
            message: "Razorpay order created",
            error: false,
            success: true,
            data: razorpayOrder
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function razorpayVerifyController(request, response) {
    try {
        const userId = request.userId
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            list_items,
            addressId,
            subTotalAmt,
            totalAmt,
            discountAmt = 0,
        } = request.body

        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return response.status(400).json({
                message: "Payment verification failed. Invalid signature.",
                error: true,
                success: false
            })
        }

        const items = list_items.map(el => ({
            productId: el.productId._id,
            product_details: {
                name: el.productId.name,
                image: el.productId.image
            },
            quantity: el.quantity || 1,
            price: el.productId.price || 0,
        }))

        const order = await OrderModel.create({
            userId: userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            items: items,
            paymentId: razorpay_payment_id,
            payment_status: "PAID",
            delivery_address: addressId,
            subTotalAmt: subTotalAmt,
            totalAmt: totalAmt,
            discountAmt: discountAmt,
            orderStatus: "Confirmed",
        })

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })

        return response.json({
            message: "Payment verified and order placed successfully!",
            error: false,
            success: true,
            data: order
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId

        const orderlist = await OrderModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .populate('delivery_address')

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getOrderByIdController(request, response) {
    try {
        const userId = request.userId
        const { id } = request.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({
                message: "Invalid order ID",
                error: true,
                success: false
            })
        }

        const order = await OrderModel.findOne({ _id: id, userId: userId })
            .populate('delivery_address')

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            })
        }

        return response.json({
            message: "Order details",
            data: order,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function cancelOrderController(request, response) {
    try {
        const userId = request.userId
        const { id } = request.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({
                message: "Invalid order ID",
                error: true,
                success: false
            })
        }

        const order = await OrderModel.findOne({ _id: id, userId: userId })

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            })
        }

        if (order.orderStatus === 'Delivered') {
            return response.status(400).json({
                message: "Delivered orders cannot be cancelled",
                error: true,
                success: false
            })
        }

        if (order.orderStatus === 'Cancelled') {
            return response.status(400).json({
                message: "Order is already cancelled",
                error: true,
                success: false
            })
        }

        order.orderStatus = 'Cancelled'
        await order.save()

        return response.json({
            message: "Order cancelled successfully",
            data: order,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
