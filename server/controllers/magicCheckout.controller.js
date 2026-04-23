import DeliveryZoneModel from '../models/deliveryZone.model.js'
import CouponModel       from '../models/coupon.model.js'
import SettingModel      from '../models/settings.model.js'
import OrderModel        from '../models/order.model.js'
import UserModel         from '../models/user.model.js'
import sendEmail         from '../config/sendEmail.js'
import { sendFreeTextWhatsApp } from '../utils/whatsapp.js'

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
                if (c.discountType === 'percentage' || c.discountType === 'first_order') {
                    description = `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}${c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ''}`
                } else if (c.discountType === 'flat') {
                    description = `₹${c.discountValue} off${c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ''}`
                } else if (c.discountType === 'free_shipping') {
                    description = 'Free shipping'
                }
                return {
                    reference_id:  c.code,
                    code:          c.code,
                    type:          'coupon',
                    description,
                    tnc:           c.minOrderAmount ? `Min order ₹${c.minOrderAmount}` : 'No minimum order',
                }
            })

        return response.status(200).json({ promotions })

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
        // Razorpay sends: order_id, contact, email, code, amount (in paise), cart
        const { order_id, contact, email, code, amount: amountPaise, cart } = request.body

        if (!code) {
            return response.status(400).json({ success: false, error: true, message: 'Coupon code required' })
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true }).lean()

        if (!coupon) {
            return response.status(200).json({
                valid: false,
                error: { description: 'Invalid or expired coupon code' }
            })
        }

        const now = new Date()
        if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
            return response.status(200).json({
                valid: false,
                error: { description: 'This coupon has expired' }
            })
        }

        if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
            return response.status(200).json({
                valid: false,
                error: { description: 'Coupon usage limit reached' }
            })
        }

        // Order amount in paise (Razorpay sends it); fallback to cart total
        const orderPaise = amountPaise
            || (cart?.total)
            || 0

        // Minimum order check (coupon.minOrderAmount is in rupees)
        const orderRupees = orderPaise / 100
        if (coupon.minOrderAmount && orderRupees < coupon.minOrderAmount) {
            return response.status(200).json({
                valid: false,
                error: { description: `Minimum order amount ₹${coupon.minOrderAmount} required` }
            })
        }

        // Compute discount always in paise (flat value expected by Razorpay)
        let discountPaise = 0
        let description   = ''

        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order') {
            const pct = coupon.discountValue          // e.g. 29
            discountPaise = Math.round((orderPaise * pct) / 100)
            // Apply max discount cap if set
            if (coupon.maxDiscount) {
                const maxPaise = Math.round(coupon.maxDiscount * 100)
                discountPaise  = Math.min(discountPaise, maxPaise)
            }
            description = `${pct}% off${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}`

        } else if (coupon.discountType === 'flat') {
            discountPaise = Math.round(coupon.discountValue * 100)
            description   = `₹${coupon.discountValue} off`

        } else if (coupon.discountType === 'free_shipping') {
            // Treat as ₹0 flat discount so Razorpay can show it
            discountPaise = 0
            description   = 'Free shipping'
        }

        // Cap discount at the order amount
        discountPaise = Math.min(discountPaise, orderPaise)

        return response.status(200).json({
            valid:          true,
            discount_type:  'flat',
            discount_value: discountPaise,
            reference_id:   coupon.code,
            description,
        })

    } catch (error) {
        console.error('Magic Checkout applyPromotion error:', error.message)
        return response.status(200).json({
            valid: false,
            error: { description: 'Could not apply coupon. Please try again.' }
        })
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
