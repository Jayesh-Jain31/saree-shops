import DeliveryZoneModel from '../models/deliveryZone.model.js'
import CouponModel       from '../models/coupon.model.js'
import SettingModel      from '../models/settings.model.js'
import OrderModel        from '../models/order.model.js'

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
        const { order_id, contact, email, code } = request.body

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

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return response.status(200).json({
                valid: false,
                error: { description: 'Coupon usage limit reached' }
            })
        }

        // Compute discount (Razorpay expects value in paise)
        let discountPaise = 0
        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order') {
            // We don't know the exact order amount here from Razorpay's call,
            // so we return the percentage — Razorpay will calculate
            return response.status(200).json({
                valid:           true,
                discount_type:  'percentage',
                discount_value: coupon.discountValue,
                reference_id:   coupon.code,
                description:    `${coupon.discountValue}% off`,
            })
        } else if (coupon.discountType === 'flat') {
            discountPaise = Math.round(coupon.discountValue * 100)
        } else if (coupon.discountType === 'free_shipping') {
            return response.status(200).json({
                valid:          true,
                discount_type: 'shipping',
                reference_id:  coupon.code,
                description:   'Free shipping applied',
            })
        }

        return response.status(200).json({
            valid:          true,
            discount_type: 'flat',
            discount_value: discountPaise,
            reference_id:  coupon.code,
            description:   `₹${coupon.discountValue} off`,
        })

    } catch (error) {
        console.error('Magic Checkout applyPromotion error:', error.message)
        return response.status(200).json({
            valid: false,
            error: { description: 'Could not apply coupon. Please try again.' }
        })
    }
}
