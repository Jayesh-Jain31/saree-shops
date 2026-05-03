import Razorpay from "../config/razorpay.js";
import { getPopupCoupon, getPopupAddresses } from "../controllers/magicCheckout.controller.js"
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
import { debitWalletInternal } from "./wallet.controller.js";
import { createNotification } from '../utils/notificationHelper.js'
import {
    sendOrderConfirmationWhatsApp,
    sendCODVerificationWhatsApp,
    sendOrderStatusWhatsApp,
    sendAdminNewOrderAlert,
    sendAdminLowStockAlert
} from "../utils/whatsapp.js";
import SettingModel from "../models/settings.model.js";
import DeliveryZoneModel from "../models/deliveryZone.model.js";
import { getPendingPointsCount, redeemPointsInternal, deductPointsInternal } from "./loyalty.controller.js"
import { getActiveFreeGiftInternal } from "./freeGift.controller.js";

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
        const { list_items, totalAmt, addressId, subTotalAmt, deliveryCharge = 0, discountAmt = 0, couponCode = "", couponDiscount = 0, walletDeduction = 0, loyaltyPointsUsed = 0, loyaltyDiscount = 0, razorpay_order_id = "" } = request.body

        // If this COD came from inside the Razorpay popup, check for a popup-applied coupon
        // NOTE: Do NOT recalculate totalAmt here — wait until delivery charge is resolved below,
        // because the popup may have a different address/delivery charge than the pre-checkout selection.
        let finalCouponCode = couponCode
        let finalCouponDiscount = couponDiscount
        if (razorpay_order_id) {
            const popupCoupon = getPopupCoupon(razorpay_order_id)
            if (popupCoupon) {
                finalCouponCode     = popupCoupon.code
                finalCouponDiscount = popupCoupon.discountRupees
            }
        }

        const items = list_items.map(el => ({
            productId: el.productId._id,
            product_details: {
                name:     el.productId.name,
                image:    el.productId.image,
                discount: el.productId.discount || 0,
            },
            quantity: el.quantity || 1,
            price: el.productId.price || 0,
        }))

        // Auto-append active free gift if cart qualifies
        const freeGift = await getActiveFreeGiftInternal(subTotalAmt || 0)
        if (freeGift) {
            items.push({
                productId: freeGift.productId._id,
                product_details: { name: freeGift.productId.name, image: freeGift.productId.image, discount: 0 },
                quantity: 1,
                price: 0,
                isFreeGift: true,
            })
        }

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

        // Build delivery_address_snapshot.
        // If this is COD from Magic Checkout popup (razorpay_order_id provided),
        // use addresses from the popup address map (saved during shipping-info call).
        let delivery_address_snapshot = {}
        let resolvedDeliveryCharge = deliveryCharge

        if (razorpay_order_id) {
            const popupAddresses = getPopupAddresses(razorpay_order_id)
            // Razorpay sends all addresses for serviceability check; use the first one
            // (most likely the selected one, especially when the user has one saved address)
            if (popupAddresses && popupAddresses.length > 0) {
                const pa = popupAddresses.find(a => a.isSelected) || popupAddresses[0]
                delivery_address_snapshot = {
                    name:         pa.name    || '',
                    mobile:       String(pa.contact || '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10) || '',
                    address_line: [pa.line1, pa.line2].filter(Boolean).join(', ') || '',
                    city:         pa.city    || '',
                    state:        pa.state   || '',
                    pincode:      String(pa.zipcode || ''),
                    country:      (pa.country === 'IN' || pa.country === 'in') ? 'India' : (pa.country || 'India'),
                    landmark:     pa.line2   || '',
                }
                if (pa._computedShippingRupees != null) {
                    resolvedDeliveryCharge = pa._computedShippingRupees
                }
            }
        }

        // If still no snapshot (no popup address or not from popup), fall back to DB address
        if (!delivery_address_snapshot.address_line && !delivery_address_snapshot.name) {
            const addrDoc = await AddressModel.findById(addressId).lean()
            delivery_address_snapshot = addrDoc ? {
                name:         addrDoc.name         || '',
                mobile:       addrDoc.mobile        || '',
                address_line: addrDoc.address_line  || '',
                city:         addrDoc.city          || '',
                state:        addrDoc.state         || '',
                pincode:      String(addrDoc.pincode || ''),
                country:      addrDoc.country       || 'India',
                landmark:     addrDoc.landmark      || '',
            } : {}
        }

        // Recalculate total from authoritative resolved values.
        // Do NOT use frontend totalAmt directly — it was computed before the popup ran and
        // may have a different coupon / delivery charge than what the user actually confirmed.
        const finalTotalAmt = Math.max(
            0,
            subTotalAmt + resolvedDeliveryCharge - finalCouponDiscount - (walletDeduction || 0) - (loyaltyDiscount || 0)
        )

        console.log("[COD] ORDER AMOUNTS:", {
            subTotalAmt, resolvedDeliveryCharge, finalCouponDiscount, walletDeduction, loyaltyDiscount, finalTotalAmt,
            couponCode: finalCouponCode, address: delivery_address_snapshot.address_line,
        })

        const pendingLoyaltyPoints = await getPendingPointsCount(subTotalAmt).catch(() => 0)

        const order = await OrderModel.create({
            userId: userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            items: items,
            paymentId: "",
            payment_status: "CASH ON DELIVERY",
            delivery_address: null,
            delivery_address_snapshot,
            subTotalAmt: subTotalAmt,
            deliveryCharge: resolvedDeliveryCharge,
            totalAmt: finalTotalAmt,
            discountAmt: finalCouponDiscount,
            couponCode: finalCouponCode,
            couponDiscount: finalCouponDiscount,
            walletDeduction: walletDeduction,
            loyaltyPointsUsed: loyaltyPointsUsed,
            loyaltyDiscount: loyaltyDiscount,
            orderStatus: "Confirmed",
            fraudRiskScore: fraud.riskScore,
            fraudRiskLevel: fraud.riskLevel,
            loyaltyPointsPending: pendingLoyaltyPoints,
            loyaltyPointsProcessed: false,
        })

        console.log(`[COD] ${pendingLoyaltyPoints} loyalty pts pending for order ${order.orderId} (credited to wallet after return period)`)

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

        // Debit wallet server-side (safe for all order flows)
        if (walletDeduction > 0) {
            try {
                await debitWalletInternal(userId, walletDeduction, `Payment for order ${order.orderId}`, order.orderId)
            } catch (walletErr) {
                console.error(`[COD] Wallet debit failed for order ${order.orderId}:`, walletErr.message)
            }
        }

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })
        await decrementStock(order.items)
        creditReferralReward(userId).catch(() => {})
        createNotification(userId, `Your COD order ${order.orderId} has been placed successfully! 🛍️`, 'success', '/dashboard/myorders').catch(() => {})

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

        // Compute raw cart subtotal from items (before wallet/coupon deductions)
        // so gift eligibility is based on what's actually in the cart, not the discounted payable amount
        const rawSubTotal = list_items.reduce((sum, item) => {
            const p = item.productId || {}
            const price    = p.price || 0
            const discount = p.discount || 0
            const discountedPrice = price * (1 - discount / 100)
            return sum + discountedPrice * (item.quantity || 1)
        }, 0)

        // Check for active free gift and prepend as the FIRST promotional line item
        const freeGiftRzp = await getActiveFreeGiftInternal(rawSubTotal)
        let freeGiftData = null
        if (freeGiftRzp) {
            const gp = freeGiftRzp.productId
            const originalPaise = Math.round((gp.price || 0) * 100)
            // Use a short constant variant_id "GIFT".
            // Long IDs like "gift_<mongoId>" can confuse Razorpay's matching logic.
            // "GIFT" is guaranteed to never equal any cart item's product ObjectId,
            // so Razorpay will never merge the gift with a regular line item.
            // The promotional_tag on the frontend must use the same id.
            const giftVariantId = 'GIFT'

            // Razorpay always renders the `price` field as the displayed item price.
            // offer_price only affects the "Discount on price" row, not the per-item display.
            // Setting price:0 → Razorpay shows ₹0 next to the gift item.
            // The "free gift item" badge comes from promotional_tag on the frontend.
            // Razorpay checkout is HTTPS — ensure image_url is always HTTPS
            const giftImageUrl = (gp.image?.[0] || '').replace(/^http:\/\//i, 'https://')

            line_items.unshift({
                sku:         giftVariantId,
                variant_id:  giftVariantId,
                price:       0,
                offer_price: 0,
                quantity:    1,
                name:        gp.name || 'Free Gift',
                ...(giftImageUrl && { image_url: giftImageUrl }),
            })
            freeGiftData = {
                productId:    String(gp._id),
                giftVariantId,
                name:         gp.name,
                image:        giftImageUrl,
            }
        }

        const amountPaise = Math.round(totalAmt * 100)

        // line_items_total MUST equal the sum of (offer_price × quantity) for every line item.
        // Razorpay uses this to validate the order summary and compute "Discount on price".
        // Setting it to amountPaise (after wallet/coupon) causes a mismatch that hides the ₹0 display.
        const lineItemsTotal = line_items.reduce(
            (sum, li) => sum + (li.offer_price * (li.quantity || 1)), 0
        )

        const options = {
            amount: amountPaise,
            currency: "INR",
            receipt: `receipt_${new mongoose.Types.ObjectId()}`,
            ...(line_items.length > 0 && {
                line_items_total: lineItemsTotal,
                line_items,
            })
        }

        const razorpayOrder = await Razorpay.orders.create(options)

        return response.status(200).json({
            message: "Razorpay order created",
            error: false,
            success: true,
            data: razorpayOrder,
            freeGift: freeGiftData,
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
            deliveryCharge = 0,
            totalAmt,
            discountAmt = 0,
            couponCode = "",
            couponDiscount = 0,
            walletDeduction = 0,
            loyaltyPointsUsed = 0,
            loyaltyDiscount = 0,
        } = request.body
        
        
const popupAddresses = getPopupAddresses(razorpay_order_id)
console.log("POPUP ADDRESSES:", popupAddresses)

        // Fetch actual payment details from Razorpay to reliably detect COD and extract address
        // (Magic Checkout COD passes a signature too, so client-side check is unreliable)
        let isCOD = false
        let rzpCouponCode = couponCode
        let rzpCouponDiscount = couponDiscount
        let rzpTotalAmt = totalAmt
        let paymentDetails = null

        try {
            paymentDetails = await Razorpay.payments.fetch(razorpay_payment_id)
            console.log("FULL PAYMENT DETAILS:", JSON.stringify(paymentDetails, null, 2))
            isCOD = paymentDetails.method === 'cod'
            // For online (non-COD) payments, use the actual charged amount as source of truth
            // This handles any adjustments Razorpay made (different delivery fee for popup address, etc.)
            if (!isCOD && paymentDetails?.amount) {
                rzpTotalAmt = paymentDetails.amount / 100
            }
        } catch (fetchErr) {
            if(process.env.NODE_ENV !== 'production') console.log("Razorpay payment fetch error:", fetchErr?.message)
        }

        // Check if a coupon was applied inside the Razorpay popup
        // (apply-promotion saves the mapping when Razorpay calls that endpoint)
        const popupCoupon = getPopupCoupon(razorpay_order_id)
        console.log(`[verify] order=${razorpay_order_id} popupCoupon=`, popupCoupon)
        if (popupCoupon) {
            // Popup coupon overrides any UI coupon (customer can only apply one at a time)
            rzpCouponCode     = popupCoupon.code
            rzpCouponDiscount = popupCoupon.discountRupees
            // For non-COD: rzpTotalAmt is already the actual charged amount from Razorpay (paymentDetails.amount / 100)
            // which already includes the coupon deduction — don't subtract again.
            // For COD (isCOD=true): no paymentDetails.amount, so use the frontend-provided totalAmt minus coupon.
            if (isCOD) {
                rzpTotalAmt = Math.max(0, totalAmt - popupCoupon.discountRupees)
            }
        }

        // For online payments, verify signature. Skip for COD (no signature for COD in Magic Checkout)
        if (!isCOD) {
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
        }

        const items = list_items.map(el => ({
            productId: el.productId._id,
            product_details: {
                name:     el.productId.name,
                image:    el.productId.image,
                discount: el.productId.discount || 0,
            },
            quantity: el.quantity || 1,
            price: el.productId.price || 0,
        }))

        // Auto-append active free gift if cart qualifies
        const freeGiftVerify = await getActiveFreeGiftInternal(subTotalAmt || 0)
        if (freeGiftVerify) {
            items.push({
                productId: freeGiftVerify.productId._id,
                product_details: { name: freeGiftVerify.productId.name, image: freeGiftVerify.productId.image, discount: 0 },
                quantity: 1,
                price: 0,
                isFreeGift: true,
            })
        }

        if (loyaltyPointsUsed > 0) {
            await redeemPointsInternal(userId, loyaltyPointsUsed, 'pending')
        }

        // ── Step 1: Address from popup map (saved during Razorpay shipping-info call) ───────
        let delivery_address_snapshot = {}
        let resolvedDeliveryCharge = deliveryCharge

        if (popupAddresses && popupAddresses.length > 0) {
            const pa = popupAddresses.find(a => a.isSelected) || popupAddresses[0]
            delivery_address_snapshot = {
                name:         pa.name || '',
                mobile:       String(pa.contact || '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10),
                address_line: [pa.line1, pa.line2].filter(Boolean).join(', '),
                city:         pa.city  || '',
                state:        pa.state || '',
                pincode:      String(pa.zipcode || ''),
                country:      (pa.country === 'IN' ? 'India' : pa.country) || 'India',
                landmark:     pa.line2 || '',
            }
            if (pa._computedShippingRupees != null) {
                resolvedDeliveryCharge = pa._computedShippingRupees
            }
        }

        // ── Step 2: Razorpay billing object is the most reliable address source ─────────
        // It reflects the exact address the customer confirmed at payment time.
        // Apply for ALL payment types (online AND COD from Magic Checkout).
        if (paymentDetails?.billing) {
            const ba    = paymentDetails.billing
            const bAddr = ba.address || {}
            if (ba.name || bAddr.line1 || bAddr.city) {
                delivery_address_snapshot = {
                    name:         ba.name || delivery_address_snapshot.name || '',
                    mobile:       String(ba.contact || '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10) || delivery_address_snapshot.mobile || '',
                    address_line: [bAddr.line1, bAddr.line2].filter(Boolean).join(', ') || delivery_address_snapshot.address_line || '',
                    city:         bAddr.city  || delivery_address_snapshot.city  || '',
                    state:        bAddr.state || delivery_address_snapshot.state || '',
                    pincode:      String(bAddr.zipcode || '') || delivery_address_snapshot.pincode || '',
                    country:      (bAddr.country === 'IN' ? 'India' : (bAddr.country || '')) || delivery_address_snapshot.country || 'India',
                    landmark:     bAddr.line2 || delivery_address_snapshot.landmark || '',
                }
                // Re-derive delivery charge from the billing address pincode.
                // This ensures the popup-selected address delivery charge is correct
                // even when the in-memory address map was wiped (e.g. server restart).
                const billingPincode = String(bAddr.zipcode || '').trim()
                if (billingPincode) {
                    try {
                        const matchedZones = await DeliveryZoneModel.find({
                            isActive: true,
                            pincodes: billingPincode
                        }).lean()
                        resolvedDeliveryCharge = matchedZones.length > 0 ? matchedZones[0].deliveryCharge : 0
                    } catch (zoneErr) {
                        console.log("[verify] delivery zone lookup failed:", zoneErr.message)
                    }
                }
            }
        }

        // ── Step 2.5: Fetch Razorpay order for COD address + coupon code from notes ───────
        // For COD: paymentDetails.billing is null; get address from customer_details.
        // For all payment types: read popup_coupon_code from order notes (set by apply-promotion)
        // so we can recover the coupon code even if the in-memory map was wiped.
        let rzpOrderNotes = {}
        try {
            const rzpOrder    = await Razorpay.orders.fetch(razorpay_order_id)
            rzpOrderNotes     = rzpOrder?.notes || {}

            // COD address from Razorpay order (only needed when address not already resolved)
            if (isCOD && !delivery_address_snapshot.name) {
                const custDetails = rzpOrder?.customer_details || {}
                const shipAddr    = custDetails.shipping_address || custDetails.billing_address || {}
                const addrName    = shipAddr.name || custDetails.name || ''
                const addrContact = shipAddr.contact || custDetails.contact || ''
                if (addrName || shipAddr.line1 || shipAddr.city) {
                    delivery_address_snapshot = {
                        name:         addrName,
                        mobile:       String(addrContact).replace(/^\+91/, '').replace(/\D/g, '').slice(-10),
                        address_line: [shipAddr.line1, shipAddr.line2].filter(Boolean).join(', '),
                        city:         shipAddr.city  || '',
                        state:        shipAddr.state || '',
                        pincode:      String(shipAddr.zipcode || ''),
                        country:      (['in','IN'].includes(shipAddr.country) ? 'India' : (shipAddr.country || 'India')),
                        landmark:     shipAddr.line2 || '',
                    }
                    const shipPincode = String(shipAddr.zipcode || '').trim()
                    if (shipPincode) {
                        const matchedZones = await DeliveryZoneModel.find({
                            isActive: true, pincodes: shipPincode
                        }).lean()
                        resolvedDeliveryCharge = matchedZones.length > 0 ? matchedZones[0].deliveryCharge : 0
                    }
                    console.log(`[verify] COD address from rzp order: ${delivery_address_snapshot.city}, delivery=₹${resolvedDeliveryCharge}`)
                }
            }
        } catch (orderFetchErr) {
            console.log("[verify] Razorpay order fetch failed:", orderFetchErr.message)
        }

        // ── Step 3: Fallback to saved DB address if nothing found above ─────────────────
        if (!delivery_address_snapshot.address_line && !delivery_address_snapshot.name) {
            const addrDoc = await AddressModel.findById(addressId).lean()
            delivery_address_snapshot = addrDoc ? {
                name:         addrDoc.name         || '',
                mobile:       addrDoc.mobile        || '',
                address_line: addrDoc.address_line  || '',
                city:         addrDoc.city          || '',
                state:        addrDoc.state         || '',
                pincode:      String(addrDoc.pincode || ''),
                country:      addrDoc.country       || 'India',
                landmark:     addrDoc.landmark      || '',
            } : {}
        }

        // ── Amounts ──────────────────────────────────────────────────────────────────────
        // Use frontend subTotalAmt (which is the discounted product total) as the source of truth.
        // Do NOT recalculate from item.price — those are the full/original prices, not discounted.
        const finalSubTotal = subTotalAmt || 0
        const finalDelivery = resolvedDeliveryCharge || 0

        // Coupon: popup map is primary source. If map was wiped (server restart), derive
        // discount from the difference between subTotal+delivery and Razorpay's charged amount.
        // Also try Razorpay order notes (set by apply-promotion) as a persistent fallback for code.
        let finalCouponDiscount = rzpCouponDiscount || 0
        let finalCouponCode     = rzpCouponCode || ''

        // Notes fallback: if popup map is empty, try to get coupon from Razorpay order notes
        if (!finalCouponCode && rzpOrderNotes.popup_coupon_code) {
            finalCouponCode     = rzpOrderNotes.popup_coupon_code
            finalCouponDiscount = finalCouponDiscount || Number(rzpOrderNotes.popup_coupon_discount) || 0
            console.log(`[verify] coupon recovered from rzp notes: ${finalCouponCode} ₹${finalCouponDiscount}`)
        }

        if (!finalCouponDiscount && paymentDetails?.amount) {
            const rzpCharged = paymentDetails.amount / 100  // what Razorpay actually charged/recorded
            const derivedDiscount = Math.round(
                (finalSubTotal + finalDelivery) - rzpCharged - (walletDeduction || 0) - (loyaltyDiscount || 0)
            )
            if (derivedDiscount > 0) {
                finalCouponDiscount = derivedDiscount
                // Code already set from notes above, or keep whatever the frontend sent
                if (!finalCouponCode) finalCouponCode = couponCode || ''
                console.log(`[verify] coupon derived from Razorpay amount: ₹${derivedDiscount}`)
            }
        }

        // Final total:
        // • Online + COD via Magic Checkout → trust Razorpay's actual recorded amount
        // • Fallback → recalculate from scratch
        let finalTotal = 0
        if (paymentDetails?.amount) {
            finalTotal = paymentDetails.amount / 100
        } else {
            finalTotal = Math.max(0, finalSubTotal + finalDelivery - finalCouponDiscount - (walletDeduction || 0) - (loyaltyDiscount || 0))
        }

        console.log("[verify] ORDER AMOUNTS:", {
            subTotal: finalSubTotal, delivery: finalDelivery, coupon: finalCouponDiscount,
            wallet: walletDeduction, loyalty: loyaltyDiscount, total: finalTotal,
            couponCode: finalCouponCode, address: delivery_address_snapshot.address_line,
        })

        const pendingLoyaltyPts = await getPendingPointsCount(finalSubTotal).catch(() => 0)

        const order = await OrderModel.create({
            userId:    userId,
            orderId:   `ORD-${new mongoose.Types.ObjectId()}`,
            items:     items,
            paymentId: razorpay_payment_id,
            payment_status: isCOD ? "CASH ON DELIVERY" : "PAID",
            delivery_address: null,
            delivery_address_snapshot,

            subTotalAmt:   finalSubTotal,
            deliveryCharge: finalDelivery,
            totalAmt:       finalTotal,

            discountAmt:     finalCouponDiscount,
            couponCode:      finalCouponCode,
            couponDiscount:  finalCouponDiscount,

            walletDeduction:    walletDeduction,
            loyaltyPointsUsed:  loyaltyPointsUsed,
            loyaltyDiscount:    loyaltyDiscount,

            orderStatus: "Confirmed",
            loyaltyPointsPending:  pendingLoyaltyPts,
            loyaltyPointsProcessed: false,
        })

        console.log(`[Verify] ${order.loyaltyPointsPending} loyalty pts pending for order ${order.orderId} (credited to wallet after return period)`)

        // Debit wallet server-side (safe for all order flows)
        if (walletDeduction > 0) {
            try {
                await debitWalletInternal(userId, walletDeduction, `Payment for order ${order.orderId}`, order.orderId)
            } catch (walletErr) {
                console.error(`[Verify] Wallet debit failed for order ${order.orderId}:`, walletErr.message)
            }
        }

        await CartProductModel.deleteMany({ userId: userId })
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] })
        await decrementStock(order.items)
        creditReferralReward(userId).catch(() => {})
        createNotification(userId, `Your order ${order.orderId} has been placed & payment confirmed! 🎉`, 'success', '/dashboard/myorders').catch(() => {})

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
