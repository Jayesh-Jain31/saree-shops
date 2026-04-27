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

// In-memory store: maps Razorpay order_id → applied popup coupon info
// Entries expire after 30 minutes to avoid memory bloat
const popupCouponMap = new Map()
export function getPopupCoupon(razorpayOrderId) {
    const entry = popupCouponMap.get(razorpayOrderId)
    if (!entry) return null
    if (Date.now() - entry.ts > 30 * 60 * 1000) { popupCouponMap.delete(razorpayOrderId); return null }
    return entry
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
        const now     = new Date()
        const coupons = await CouponModel.find({
            isActive:  true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        }).lean()

        const promotions = coupons
            .filter(c => !c.usageLimit || c.usageCount < c.usageLimit)
            .map(c => {
                let summary     = ''
                let description = ''

                if (c.discountType === 'percentage' || c.discountType === 'first_order') {
                    summary     = `${c.discountValue}% off on total cart value`
                    description = `${c.discountValue}% off on total cart value${c.maxDiscount ? ` upto ₹${c.maxDiscount}` : ''}${c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ''}`
                } else if (c.discountType === 'flat') {
                    summary     = `₹${c.discountValue} off on total cart value`
                    description = `₹${c.discountValue} off${c.minOrderAmount ? ` on a minimum cart value of ₹${c.minOrderAmount}` : ''}`
                } else if (c.discountType === 'free_shipping') {
                    summary     = 'Free shipping on this order'
                    description = 'Free shipping applied on this order'
                }

                return { code: c.code, summary, description }
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
            const r = { failure_code: 'INVALID_PROMOTION' }
            captureDebug('apply-promotion-ERR-nocode', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true }).lean()

        if (!coupon) {
            const r = { failure_code: 'INVALID_PROMOTION' }
            captureDebug('apply-promotion-ERR-notfound', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        const now = new Date()
        if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
            const r = { failure_code: 'INVALID_PROMOTION' }
            captureDebug('apply-promotion-ERR-expired', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
            const r = { failure_code: 'INVALID_PROMOTION' }
            captureDebug('apply-promotion-ERR-limit', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        // Resolve order amount in paise AND get the canonical Razorpay order_xxx ID
        // (Razorpay sometimes sends receipt value instead of order_xxx in apply-promotion)
        let orderPaise = amountPaise || (cart?.total) || 0
        let resolvedOrderId = order_id  // will be updated to order_xxx if we resolve it

        if (order_id) {
            try {
                if (order_id.startsWith('order_')) {
                    // Already a Razorpay order ID
                    if (!orderPaise) {
                        const rzpOrder = await Razorpay.orders.fetch(order_id)
                        orderPaise = rzpOrder?.amount || 0
                    }
                    resolvedOrderId = order_id
                } else {
                    // Razorpay sent the receipt value — resolve to the actual order_xxx ID
                    const result = await Razorpay.orders.all({ receipt: order_id })
                    const rzpOrder = result?.items?.[0]
                    if (rzpOrder) {
                        if (!orderPaise) orderPaise = rzpOrder.amount || 0
                        resolvedOrderId = rzpOrder.id  // canonical order_xxx ID
                    }
                }
            } catch (e) {
                console.warn('Could not resolve order amount/id:', e.message)
            }
        }

        // Minimum order check (coupon.minOrderAmount is in rupees)
        const orderRupees = orderPaise / 100
        if (coupon.minOrderAmount && orderRupees > 0 && orderRupees < coupon.minOrderAmount) {
            const r = { failure_code: 'REQUIREMENT_NOT_MET' }
            captureDebug('apply-promotion-ERR-minorder', request.headers, request.body, r)
            return response.status(200).json(r)
        }

        // Calculate discount in paise
        let discountPaise = 0
        let description   = ''

        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order') {
            const pct = coupon.discountValue
            if (orderPaise > 0) {
                discountPaise = Math.round((orderPaise * pct) / 100)
                if (coupon.maxDiscount) {
                    discountPaise = Math.min(discountPaise, Math.round(coupon.maxDiscount * 100))
                }
                discountPaise = Math.min(discountPaise, orderPaise)
            }
            description = `${pct}% off${coupon.maxDiscount ? ` upto ₹${coupon.maxDiscount}` : ''}`
        } else if (coupon.discountType === 'flat') {
            discountPaise = Math.round(coupon.discountValue * 100)
            if (orderPaise > 0) discountPaise = Math.min(discountPaise, orderPaise)
            description = `₹${coupon.discountValue} off`
        } else if (coupon.discountType === 'free_shipping') {
            discountPaise = 0
            description   = 'Free shipping'
        }

        // Save to in-memory map so verify controller can record the popup coupon on the order
        // Save under BOTH the received order_id AND the resolved order_xxx ID so lookup always works
        const couponEntry = {
            code:           coupon.code,
            discountRupees: discountPaise / 100,
            ts:             Date.now(),
        }
        if (order_id)         popupCouponMap.set(order_id, couponEntry)
        if (resolvedOrderId && resolvedOrderId !== order_id) popupCouponMap.set(resolvedOrderId, couponEntry)
        console.log(`[apply-promotion] saved coupon ${coupon.code} discount=${discountPaise/100} keys=[${order_id}, ${resolvedOrderId}]`)

        // Exact format per Razorpay docs (from official documentation)
        const applyResult = {
            promotion: {
                reference_id: String(coupon._id),
                type:         'offer',
                code:         coupon.code,
                value:        discountPaise,
                value_type:   'fixed_amount',
                description,
            }
        }
        captureDebug('apply-promotion', request.headers, request.body, applyResult)
        return response.status(200).json(applyResult)

    } catch (error) {
        console.error('Magic Checkout applyPromotion error:', error.message)
        const r = { failure_code: 'INVALID_PROMOTION' }
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
