import Razorpay from "../config/razorpay.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import sendEmail from "../config/sendEmail.js";
import orderConfirmationTemplate from "../utils/orderConfirmationTemplate.js";
import FraudFlagModel from "../models/fraudFlag.model.js";
import { assessOrderRisk } from "../utils/fraudDetection.js";
import WalletModel from "../models/wallet.model.js";
import {
    sendOrderConfirmationWhatsApp,
    sendCODVerificationWhatsApp,
    sendOrderStatusWhatsApp
} from "../utils/whatsapp.js";

// Helper: decrement stock for each ordered item
async function decrementStock(items) {
    await Promise.all(items.map(item =>
        ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
        })
    ))
}

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId
        const { list_items, totalAmt, addressId, subTotalAmt, discountAmt = 0, couponCode = "", couponDiscount = 0, walletDeduction = 0 } = request.body

        const items = list_items.map(el => ({
            productId: el.productId._id,
            product_details: {
                name: el.productId.name,
                image: el.productId.image
            },
            quantity: el.quantity || 1,
            price: el.productId.price || 0,
        }))

        // Check if COD is restricted for this customer
        const userCheck = await UserModel.findById(userId).select('codRestricted')
        if (userCheck?.codRestricted) {
            return response.status(403).json({
                message: 'Cash on Delivery is not available for your account. Please use online payment.',
                error: true, success: false
            })
        }

        // Fraud detection for COD orders
        const fraud = await assessOrderRisk({ userId, totalAmt, items })
        if (fraud.shouldBlock) {
            return response.status(403).json({
                message: 'This order cannot be placed. Please contact support or choose online payment.',
                error: true,
                success: false,
                fraudBlocked: true,
            })
        }

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
            couponCode: couponCode,
            couponDiscount: couponDiscount,
            walletDeduction: walletDeduction,
            orderStatus: "Confirmed",
            fraudRiskScore: fraud.riskScore,
            fraudRiskLevel: fraud.riskLevel,
        })

        // Flag suspicious orders (score >= 30) for admin review
        if (fraud.riskScore >= 30) {
            FraudFlagModel.create({
                type: 'order',
                orderId: order._id,
                userId,
                riskScore: fraud.riskScore,
                riskLevel: fraud.riskLevel,
                reasons: fraud.reasons,
                snapshot: { orderId: order.orderId, totalAmt, paymentMethod: 'COD' }
            }).catch(() => {})
        }

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })
        await decrementStock(order.items)

        try {
            const user = await UserModel.findById(userId)
            if (user?.email) {
                await sendEmail({
                    sendTo: user.email,
                    subject: `Order Confirmed - ${order.orderId}`,
                    html: orderConfirmationTemplate({
                        orderId: order.orderId,
                        items: order.items,
                        totalAmt: order.totalAmt,
                        payment_status: order.payment_status,
                    })
                })
            }
            if (user?.mobile) {
                sendOrderConfirmationWhatsApp({
                    mobile: user.mobile,
                    name: user.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                    paymentMethod: order.payment_status,
                    items: order.items,
                }).catch(() => {})
                sendCODVerificationWhatsApp({
                    mobile: user.mobile,
                    name: user.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                }).catch(() => {})
            }
        } catch (emailErr) {
            if(process.env.NODE_ENV !== 'production') console.log("Order confirmation email failed:", emailErr.message)
        }

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
        if(process.env.NODE_ENV !== 'production') console.log("Razorpay order creation error:", error?.error?.description || error?.message || error)
        return response.status(500).json({
            message: error?.error?.description || error.message || error,
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
            couponCode = "",
            couponDiscount = 0,
            walletDeduction = 0,
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
            couponCode: couponCode,
            couponDiscount: couponDiscount,
            walletDeduction: walletDeduction,
            orderStatus: "Confirmed",
        })

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })
        await decrementStock(order.items)

        try {
            const user = await UserModel.findById(userId)
            if (user?.email) {
                await sendEmail({
                    sendTo: user.email,
                    subject: `Order Confirmed - ${order.orderId}`,
                    html: orderConfirmationTemplate({
                        orderId: order.orderId,
                        items: order.items,
                        totalAmt: order.totalAmt,
                        payment_status: order.payment_status,
                    })
                })
            }
            if (user?.mobile) {
                sendOrderConfirmationWhatsApp({
                    mobile: user.mobile,
                    name: user.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                    paymentMethod: order.payment_status,
                    items: order.items,
                }).catch(() => {})
            }
        } catch (emailErr) {
            if(process.env.NODE_ENV !== 'production') console.log("Order confirmation email failed:", emailErr.message)
        }

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
            .populate('delivery_address').lean()

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
            .populate('delivery_address').lean()

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

        // WhatsApp notification for cancellation
        try {
            const cancelUser = await UserModel.findById(order.userId).select('name mobile')
            if (cancelUser?.mobile) {
                sendOrderStatusWhatsApp({
                    mobile: cancelUser.mobile,
                    name: cancelUser.name,
                    orderId: order.orderId,
                    status: 'Cancelled',
                    totalAmt: order.totalAmt,
                }).catch(() => {})
            }
        } catch {}

        // Instant wallet refund if wallet was used for this order
        let walletRefunded = 0
        if (order.walletDeduction && order.walletDeduction > 0) {
            try {
                let wallet = await WalletModel.findOne({ userId: order.userId })
                if (!wallet) wallet = await WalletModel.create({ userId: order.userId, balance: 0, transactions: [] })

                wallet.balance += order.walletDeduction
                wallet.transactions.unshift({
                    type: 'credit',
                    amount: order.walletDeduction,
                    description: `Refund for cancelled order #${order.orderId}`,
                    reference: order._id.toString(),
                    balanceAfter: wallet.balance
                })
                await wallet.save()
                walletRefunded = order.walletDeduction
            } catch (walletErr) {
                console.error('Wallet refund failed:', walletErr.message)
            }
        }

        return response.json({
            message: walletRefunded > 0
                ? `Order cancelled. ₹${walletRefunded} refunded to your wallet instantly.`
                : "Order cancelled successfully",
            walletRefunded,
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
