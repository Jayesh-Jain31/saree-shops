import Razorpay from "../config/razorpay.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
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
    sendOrderStatusWhatsApp,
    sendAdminNewOrderAlert,
    sendAdminLowStockAlert
} from "../utils/whatsapp.js";
import SettingModel from "../models/settings.model.js";
import { earnPointsInternal, redeemPointsInternal, deductPointsInternal } from "./loyalty.controller.js";

// Helper: decrement stock for each ordered item + low stock alert
async function decrementStock(items) {
    const updated = await Promise.all(items.map(item =>
        ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
        }, { new: true, select: 'name stock' })
    ))
    try {
        const thresholdSetting = await SettingModel.findOne({ key: 'low_stock_threshold' })
        const threshold = thresholdSetting ? parseInt(thresholdSetting.value) || 5 : 5
        const lowStock = updated.filter(p => p && p.stock !== null && p.stock >= 0 && p.stock <= threshold)
        if (lowStock.length > 0) {
            const adminSetting = await SettingModel.findOne({ key: 'admin_whatsapp_number' })
            if (adminSetting?.value) {
                sendAdminLowStockAlert(adminSetting.value, lowStock).catch(() => {})
            }
        }
    } catch {}
}

// Helper: credit referral wallet reward on first order
async function creditReferralReward(userId) {
    try {
        const user = await UserModel.findById(userId).select('referredBy referralRewardGiven')
        if (!user?.referredBy || user?.referralRewardGiven) return
        const orderCount = await import('../models/order.model.js').then(m => m.default.countDocuments({ userId }))
        if (orderCount > 1) return
        const REWARD = 100
        let referrerWallet = await WalletModel.findOne({ userId: user.referredBy })
        if (!referrerWallet) referrerWallet = await WalletModel.create({ userId: user.referredBy, balance: 0, transactions: [] })
        referrerWallet.balance += REWARD
        referrerWallet.transactions.unshift({ type: 'credit', amount: REWARD, description: 'Referral reward — friend placed first order', reference: 'REFERRAL', balanceAfter: referrerWallet.balance })
        await referrerWallet.save()
        await UserModel.findByIdAndUpdate(userId, { referralRewardGiven: true })
    } catch (err) {
        console.log('[Referral] Error crediting reward:', err.message)
    }
}

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId
        const { list_items, totalAmt, addressId, subTotalAmt, discountAmt = 0, couponCode = "", couponDiscount = 0, walletDeduction = 0, loyaltyPointsUsed = 0, loyaltyDiscount = 0 } = request.body

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

        if (loyaltyPointsUsed > 0) {
            await redeemPointsInternal(userId, loyaltyPointsUsed, 'pending')
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
            loyaltyPointsUsed: loyaltyPointsUsed,
            loyaltyDiscount: loyaltyDiscount,
            orderStatus: "Confirmed",
            fraudRiskScore: fraud.riskScore,
            fraudRiskLevel: fraud.riskLevel,
        })

        earnPointsInternal(userId, subTotalAmt, order.orderId).catch(() => {})

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
        creditReferralReward(userId).catch(() => {})

        try {
            const user = await UserModel.findById(userId)
            const address = await AddressModel.findById(addressId)
            const mobile = user?.mobile || address?.mobile

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
            if (mobile) {
                sendOrderConfirmationWhatsApp({
                    mobile,
                    name: user?.name || address?.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                    paymentMethod: order.payment_status,
                    items: order.items,
                }).catch(() => {})
                sendCODVerificationWhatsApp({
                    mobile,
                    name: user?.name || address?.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                }).catch(() => {})
            }
            SettingModel.findOne({ key: 'admin_whatsapp_number' }).then(setting => {
                if (setting?.value) {
                    sendAdminNewOrderAlert(setting.value, {
                        orderId: order.orderId,
                        customerName: user?.name || address?.name,
                        customerMobile: mobile,
                        totalAmt: order.totalAmt,
                        paymentMethod: order.payment_status,
                        itemCount: order.items?.length
                    }).catch(() => {})
                }
            }).catch(() => {})
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
        const { totalAmt, list_items = [] } = request.body

        if (!totalAmt || totalAmt <= 0) {
            return response.status(400).json({
                message: "Invalid order amount",
                error: true,
                success: false
            })
        }

        // Build line_items for Magic Checkout (mandatory)
        const line_items = list_items.map(item => {
            const product  = item.productId || {}
            const price    = Math.round((product.price || 0) * 100)          // paise
            const discount = product.discount || 0
            const offerPrice = Math.round(price * (1 - discount / 100))      // paise after discount
            return {
                sku:          String(product._id || ''),
                variant_id:   String(product._id || ''),
                price,
                offer_price:  offerPrice,
                quantity:     item.quantity || 1,
                name:         product.name  || 'Product',
                ...(product.image?.[0] && { image_url: product.image[0] })
            }
        })

        const amountPaise = Math.round(totalAmt * 100)

        // Fetch active coupon offer IDs registered with Razorpay — these show in the popup
        const CouponModel = (await import('../models/coupon.model.js')).default
        const now = new Date()
        const activeCoupons = await CouponModel.find({
            isActive: true,
            razorpayOfferId: { $exists: true, $ne: null },
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        }).lean()
        const offerIds = activeCoupons.map(c => c.razorpayOfferId).filter(Boolean)

        const options = {
            amount: amountPaise,
            currency: "INR",
            receipt: `receipt_${new mongoose.Types.ObjectId()}`,
            // Razorpay offer IDs — makes coupons visible in the checkout popup
            ...(offerIds.length > 0 && { offers: offerIds }),
            // Magic Checkout: line_items_total must equal amount to avoid mismatch in popup
            ...(line_items.length > 0 && {
                line_items_total: amountPaise,
                line_items,
            })
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
            loyaltyPointsUsed = 0,
            loyaltyDiscount = 0,
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

        if (loyaltyPointsUsed > 0) {
            await redeemPointsInternal(userId, loyaltyPointsUsed, 'pending')
        }

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
            loyaltyPointsUsed: loyaltyPointsUsed,
            loyaltyDiscount: loyaltyDiscount,
            orderStatus: "Confirmed",
        })

        earnPointsInternal(userId, subTotalAmt, order.orderId).catch(() => {})

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })
        await decrementStock(order.items)
        creditReferralReward(userId).catch(() => {})

        try {
            const user = await UserModel.findById(userId)
            const address = await AddressModel.findById(addressId)
            const mobile = user?.mobile || address?.mobile

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
            if (mobile) {
                sendOrderConfirmationWhatsApp({
                    mobile,
                    name: user?.name || address?.name,
                    orderId: order.orderId,
                    totalAmt: order.totalAmt,
                    paymentMethod: order.payment_status,
                    items: order.items,
                }).catch(() => {})
            }
            SettingModel.findOne({ key: 'admin_whatsapp_number' }).then(setting => {
                if (setting?.value) {
                    sendAdminNewOrderAlert(setting.value, {
                        orderId: order.orderId,
                        customerName: user?.name || address?.name,
                        customerMobile: mobile,
                        totalAmt: order.totalAmt,
                        paymentMethod: order.payment_status,
                        itemCount: order.items?.length
                    }).catch(() => {})
                }
            }).catch(() => {})
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

        const isCOD = !order.paymentId ||
            (order.payment_status || '').toUpperCase().includes('CASH') ||
            (order.payment_status || '').toUpperCase() === 'COD'

        let walletRefunded = 0
        let razorpayRefundInitiated = false

        // Always refund the wallet-deducted portion back to wallet
        if (order.walletDeduction && order.walletDeduction > 0) {
            try {
                let wallet = await WalletModel.findOne({ userId: order.userId })
                if (!wallet) wallet = await WalletModel.create({ userId: order.userId, balance: 0, transactions: [] })
                wallet.balance += order.walletDeduction
                wallet.transactions.unshift({
                    type: 'credit',
                    amount: order.walletDeduction,
                    description: `Wallet refund for cancelled order #${order.orderId}`,
                    reference: order._id.toString(),
                    balanceAfter: wallet.balance
                })
                await wallet.save()
                walletRefunded = order.walletDeduction
            } catch (walletErr) {
                console.error('Wallet refund failed:', walletErr.message)
            }
        }

        // Online payment: trigger Razorpay refund for the online-paid portion
        let refundError = null

        if (!isCOD && order.paymentId) {
            const onlinePaid = Math.max(0, (order.totalAmt || 0) - (order.walletDeduction || 0))
            if (onlinePaid > 0) {
                try {
                    const rzRefund = await Razorpay.payments.refund(order.paymentId, {
                        amount: Math.round(onlinePaid * 100),
                        speed: "normal",
                        notes: { reason: `Cancelled order #${order.orderId}`, orderId: order.orderId }
                    })
                    razorpayRefundInitiated = true
                    console.log(`[Refund] Razorpay refund OK — refundId: ${rzRefund?.id}, order: ${order.orderId}, amount: ₹${onlinePaid}`)
                } catch (rzErr) {
                    const rzErrMsg = rzErr?.error?.description || rzErr?.message || String(rzErr)
                    refundError = rzErrMsg
                    console.error(`[Refund] Razorpay refund FAILED — order: ${order.orderId}, paymentId: ${order.paymentId}, amount: ₹${onlinePaid}, error: ${rzErrMsg}`)
                    console.error(`[Refund] Full error:`, JSON.stringify(rzErr?.error || rzErr))
                }
            }
        }

        let message = "Order cancelled successfully"
        if (walletRefunded > 0 && razorpayRefundInitiated) {
            message = `Order cancelled. ₹${walletRefunded} refunded to wallet + Razorpay refund initiated (5-7 business days).`
        } else if (walletRefunded > 0) {
            message = `Order cancelled. ₹${walletRefunded} refunded to your wallet instantly.`
        } else if (razorpayRefundInitiated) {
            message = "Order cancelled. Razorpay refund initiated — you will receive the amount in 5-7 business days."
        } else if (!isCOD && order.paymentId && refundError) {
            message = `Order cancelled. Refund could not be processed automatically — please contact support. (${refundError})`
        }

        return response.json({
            message,
            walletRefunded,
            razorpayRefundInitiated,
            refundError,
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
