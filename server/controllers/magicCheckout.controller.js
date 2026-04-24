import DeliveryZoneModel from '../models/deliveryZone.model.js'
import CouponModel       from '../models/coupon.model.js'
import SettingModel      from '../models/settings.model.js'
import OrderModel        from '../models/order.model.js'
import UserModel         from '../models/user.model.js'
import sendEmail         from '../config/sendEmail.js'
import { sendFreeTextWhatsApp } from '../utils/whatsapp.js'
import Razorpay          from '../config/razorpay.js'

// In-memory debug log — stores last 5 requests from Razorpay for diagnosis
const debugLog = []
function captureDebug(endpoint, headers, body, responseBody) {
    debugLog.unshift({ endpoint, ts: new Date().toISOString(), headers, body, responseBody })
    if (debugLog.length > 5) debugLog.pop()
}

export function debugController(request, response) {
    response.json({ log: debugLog })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.4  Shipping Info API
//  Razorpay calls this to decide COD serviceability + shipping fees per address
//  POST /api/magic-checkout/shipping-info
// ─────────────────────────────────────────────────────────────────────────────
export async function shippingInfoController(request, response) {
    try {
        const { addresses = [] } = request.body

        // Check global COD toggle from site settings
        const codSetting = await SettingModel.findOne({ key: 'cod_enabled' }).lean()
        const globalCodOn = codSetting ? codSetting.value !== 'false' : true

        // Load all active delivery zones
        const zones = await DeliveryZoneModel.find({ isActive: true }).lean()

        const result = await Promise.all(addresses.map(async (addr) => {
            const zipcode = String(addr.zipcode || '').trim()

            // Find the matching delivery zone for this pincode
            const zone = zones.find(z => z.pincodes.includes(zipcode))

            const serviceable  = true               // we ship everywhere by default
            const shippingFee  = zone ? zone.deliveryCharge * 100 : 0   // paise
            const codAvailable = globalCodOn        // respect site-wide toggle

            return {
                id:           addr.id,
                serviceable,
                cod:          codAvailable,
                cod_fee:      0,                    // no extra COD fee
                shipping_fee: shippingFee,
                pickup_available: false,
            }
        }))

        return response.status(200).json({ addresses: result })

    } catch (error) {
        console.error('Magic Checkout shippingInfo error:', error.message)
        // On error fall back to "everything OK" so checkout doesn't break
        const fallback = (request.body.addresses || []).map(a => ({
            id: a.id, serviceable: true, cod: true, cod_fee: 0, shipping_fee: 0, pickup_available: false
        }))
        return response.status(200).json({ addresses: fallback })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.5  Get Promotions API
//  Razorpay calls this to show applicable coupons/offers in the checkout popup
//  POST /api/magic-checkout/promotions
// ─────────────────────────────────────────────────────────────────────────────
export async function getPromotionsController(request, response) {
    try {
        console.log('[get-promotions] headers:', JSON.stringify(request.headers))
        console.log('[get-promotions] body:', JSON.stringify(request.body))

        const { order_id, contact, email } = request.body

        const now     = new Date()
        const coupons = await CouponModel.find({
            isActive:  true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        }).lean()

        const promotions = coupons
            .filter(c => !c.usageLimit || c.usageCount < c.usageLimit)
            .map(c => {
                let description = ''
                // value in paise — for flat coupons use the fixed amount;
                // for percentage coupons use 0 (exact value calculated at apply time)
                let value = 0

                if (c.discountType === 'percentage' || c.discountType === 'first_order') {
                    description = `${c.discountValue}% off on total cart value${c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ''}${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                    value = 0  // percentage — actual paise calculated when applied
                } else if (c.discountType === 'flat') {
                    description = `₹${c.discountValue} off${c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ''}`
                    value = Math.round(c.discountValue * 100)
                } else if (c.discountType === 'free_shipping') {
                    description = 'Free shipping on this order'
                    value = 0
                }

                // Exact format per Razorpay docs
                return {
                    reference_id: String(c._id),
                    type:         'coupon',
                    code:         c.code,
                    value,
                    description,
                }
            })

        const result = { promotions }
        captureDebug('get-promotions', request.headers, request.body, result)
        return response.status(200).json(result)

    } catch (error) {
        console.error('Magic Checkout getPromotions error:', error.message)
        return response.status(200).json({ promotions: [] })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.5.1  Apply Promotions API
//  Razorpay calls this when a customer enters / selects a coupon
//  POST /api/magic-checkout/apply-promotion
// ─────────────────────────────────────────────────────────────────────────────
export async function applyPromotionController(request, response) {
    try {
        // Log full request so we can see exactly what Razorpay sends
        console.log('[apply-promotion] headers:', JSON.stringify({
            origin: request.headers.origin,
            'content-type': request.headers['content-type'],
            'user-agent': request.headers['user-agent'],
        }))
        console.log('[apply-promotion] body:', JSON.stringify(request.body))

        // Razorpay sends: order_id (Razorpay order ID), contact, email, code
        // amount in paise may or may not be included
        const { order_id, contact, email, code, amount: amountPaise, cart } = request.body

        if (!code) {
            const r = { failure_code: 'COUPON_INVALID' }
            captureDebug('apply-promotion-ERR-nocode', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true }).lean()

        if (!coupon) {
            const r = { failure_code: 'COUPON_INVALID' }
            captureDebug('apply-promotion-ERR-notfound', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        const now = new Date()
        if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
            const r = { failure_code: 'COUPON_EXPIRED' }
            captureDebug('apply-promotion-ERR-expired', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
            const r = { failure_code: 'COUPON_ALREADY_USED' }
            captureDebug('apply-promotion-ERR-limit', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        // Resolve order amount in paise
        // Razorpay sends `amount` directly, or we look it up by order_id / receipt
        let orderPaise = amountPaise || (cart?.total) || 0

        if (!orderPaise && order_id) {
            try {
                if (order_id.startsWith('order_')) {
                    // Direct Razorpay order ID
                    const rzpOrder = await Razorpay.orders.fetch(order_id)
                    orderPaise = rzpOrder?.amount || 0
                } else {
                    // Razorpay sends the receipt value as order_id (per their docs)
                    const result = await Razorpay.orders.all({ receipt: order_id })
                    const rzpOrder = result?.items?.[0]
                    orderPaise = rzpOrder?.amount || 0
                }
            } catch (e) {
                console.warn('Could not resolve order amount:', e.message)
            }
        }

        // Minimum order check (coupon.minOrderAmount is in rupees)
        const orderRupees = orderPaise / 100
        if (coupon.minOrderAmount && orderRupees > 0 && orderRupees < coupon.minOrderAmount) {
            const r = { failure_code: 'COUPON_NOT_APPLICABLE' }
            captureDebug('apply-promotion-ERR-minorder', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        // Calculate discount in paise
        let discountPaise = 0

        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order') {
            const pct = coupon.discountValue
            if (orderPaise > 0) {
                discountPaise = Math.round((orderPaise * pct) / 100)
                if (coupon.maxDiscount) {
                    discountPaise = Math.min(discountPaise, Math.round(coupon.maxDiscount * 100))
                }
                discountPaise = Math.min(discountPaise, orderPaise)
            }
        } else if (coupon.discountType === 'flat') {
            discountPaise = Math.round(coupon.discountValue * 100)
            if (orderPaise > 0) discountPaise = Math.min(discountPaise, orderPaise)
        } else if (coupon.discountType === 'free_shipping') {
            discountPaise = 0
        }

        // Exact format per Razorpay docs: reference_id, type, code, value (paise)
        const applyResult = {
            promotion: {
                reference_id: String(coupon._id),
                type:         'coupon',
                code:         coupon.code,
                value:        discountPaise,
            }
        }
        captureDebug('apply-promotion', request.headers, request.body, applyResult)
        return response.status(200).json(applyResult)

    } catch (error) {
        console.error('Magic Checkout applyPromotion error:', error.message)
        const r = { failure_code: 'COUPON_INVALID' }
        captureDebug('apply-promotion-ERR-exception:' + error.message, request.headers, request.body, r)
        return response.status(200).json(r)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Abandoned Checkout Webhook
//  Razorpay posts here when a customer starts Magic Checkout but doesn't pay
//  POST /api/magic-checkout/abandoned-checkout
// ─────────────────────────────────────────────────────────────────────────────
export async function abandonedCheckoutWebhookController(request, response) {
    try {
        // Always respond 200 immediately so Razorpay doesn't retry
        response.status(200).json({ success: true })

        const body    = request.body || {}
        const contact = body.contact || body.customer?.contact || ''
        const email   = body.email   || body.customer?.email   || ''
        const name    = body.customer?.name || ''
        const items   = body.line_items || []
        const amount  = body.amount ? (body.amount / 100).toFixed(2) : ''

        if (!contact && !email) return  // nothing to notify

        const phone = String(contact).replace(/\D/g, '').slice(-10)

        const itemNames = items.map(i => i.name).filter(Boolean).join(', ')
        const msgBody   = `Hi ${name || 'there'}, you left your cart at Saree Shop without completing payment!${itemNames ? `\n\nItems: ${itemNames}` : ''}${amount ? `\nTotal: ₹${amount}` : ''}\n\nComplete your order here 👉 https://saree-shops-iota.vercel.app/checkout`

        // WhatsApp reminder
        if (phone) {
            sendFreeTextWhatsApp(phone, msgBody).catch(() => {})
        }

        // Email reminder
        if (email) {
            sendEmail({
                sendTo:  email,
                subject: `You left something behind! 🛍️`,
                html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
                    <h2 style="color:#be185d">Your cart is waiting!</h2>
                    <p>Hi ${name || 'there'},</p>
                    <p>You started checkout but didn't complete your payment.</p>
                    ${itemNames ? `<p><strong>Items:</strong> ${itemNames}</p>` : ''}
                    ${amount ? `<p><strong>Total:</strong> ₹${amount}</p>` : ''}
                    <a href="https://saree-shops-iota.vercel.app/checkout"
                       style="display:inline-block;margin-top:16px;padding:12px 24px;background:#be185d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                       Complete Your Order
                    </a>
                    <p style="margin-top:24px;color:#9ca3af;font-size:12px">Saree Shop</p>
                </div>`
            }).catch(() => {})
        }

    } catch (error) {
        console.error('Abandoned checkout webhook error:', error.message)
    }
}
