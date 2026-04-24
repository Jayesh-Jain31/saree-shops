import CouponModel from '../models/coupon.model.js'
import OrderModel from '../models/order.model.js'
import axios from 'axios'

// ─── Razorpay Offer Sync ──────────────────────────────────────────────────────

async function createRazorpayOffer(coupon) {
    try {
        const key_id     = process.env.RAZORPAY_KEY_ID
        const key_secret = process.env.RAZORPAY_KEY_SECRET
        if (!key_id || !key_secret) return null

        const isPercentage = coupon.discountType === 'percentage' || coupon.discountType === 'first_order'
        const isFlat       = coupon.discountType === 'flat'
        if (!isPercentage && !isFlat) return null   // free_shipping not supported as Razorpay offer

        const body = {
            name:           `${coupon.code} - ${isFlat ? `₹${coupon.discountValue} off` : `${coupon.discountValue}% off`}`,
            payment_method: 'all',
            type:           'instant',
            applicable_on:  'cart',
            code:           coupon.code,
            description:    isFlat
                              ? `₹${coupon.discountValue} off on total cart value`
                              : `${coupon.discountValue}% off on total cart value`,
            display_text:   isFlat ? `Save ₹${coupon.discountValue}` : `Save ${coupon.discountValue}%`,
            ...(isFlat
                ? { discount_amount: Math.round(coupon.discountValue * 100) }   // paise
                : {
                    discount_percent:      coupon.discountValue,
                    ...(coupon.maxDiscount && { max_discount_amount: Math.round(coupon.maxDiscount * 100) })
                  }
            ),
            min_amount: Math.round((coupon.minOrderAmount || 0) * 100),
            ...(coupon.expiresAt && { expired_at: Math.floor(new Date(coupon.expiresAt).getTime() / 1000) }),
        }

        const res = await axios.post('https://api.razorpay.com/v1/offers', body, {
            auth: { username: key_id, password: key_secret },
            timeout: 8000,
        })

        return res.data
    } catch (err) {
        console.error('[Razorpay Offer] create failed:', err?.response?.data || err.message)
        return null
    }
}

async function deactivateRazorpayOffer(offerId) {
    try {
        const key_id     = process.env.RAZORPAY_KEY_ID
        const key_secret = process.env.RAZORPAY_KEY_SECRET
        if (!key_id || !key_secret || !offerId) return

        await axios.patch(
            `https://api.razorpay.com/v1/offers/${offerId}`,
            { active: false },
            { auth: { username: key_id, password: key_secret }, timeout: 8000 }
        )
    } catch (err) {
        console.error('[Razorpay Offer] deactivate failed:', err?.response?.data || err.message)
    }
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function validateCouponController(request, response) {
    try {
        const { code, orderAmount, userId } = request.body

        if (!code) {
            return response.status(400).json({ message: 'Coupon code is required', error: true, success: false })
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true })

        if (!coupon) {
            return response.status(404).json({ message: 'Invalid or expired coupon code', error: true, success: false })
        }

        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return response.status(400).json({ message: 'This coupon has expired', error: true, success: false })
        }

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return response.status(400).json({ message: 'This coupon has reached its usage limit', error: true, success: false })
        }

        if (orderAmount < coupon.minOrderAmount) {
            return response.status(400).json({
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
                error: true, success: false
            })
        }

        // First order check
        if (coupon.discountType === 'first_order' && userId) {
            const prevOrders = await OrderModel.countDocuments({ userId })
            if (prevOrders > 0) {
                return response.status(400).json({ message: 'This coupon is valid only on your first order', error: true, success: false })
            }
        }

        let discountAmount = 0
        let freeShipping = false

        if (coupon.discountType === 'percentage' || coupon.discountType === 'first_order') {
            discountAmount = Math.floor((orderAmount * coupon.discountValue) / 100)
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount)
            }
        } else if (coupon.discountType === 'flat') {
            discountAmount = Math.min(coupon.discountValue, orderAmount)
        } else if (coupon.discountType === 'free_shipping') {
            freeShipping = true
            discountAmount = 0
        }

        const finalAmount = Math.max(0, orderAmount - discountAmount)

        return response.json({
            message: freeShipping ? 'Free shipping applied!' : 'Coupon applied successfully!',
            error: false,
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                finalAmount,
                freeShipping,
            },
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// Increment usage count when order is placed with a coupon
export async function incrementCouponUsageController(request, response) {
    try {
        const { code } = request.body
        if (!code) return response.json({ success: true })
        await CouponModel.findOneAndUpdate(
            { code: code.toUpperCase().trim() },
            { $inc: { usageCount: 1 } }
        )
        return response.json({ success: true })
    } catch (error) {
        return response.json({ success: true })
    }
}

// ─── Public: list browseable coupons ─────────────────────────────────────────

export async function getActiveCouponsPublic(request, response) {
    try {
        const now = new Date()
        const coupons = await CouponModel.find({
            isActive: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        }).select('code discountType discountValue minOrderAmount maxDiscount expiresAt usageLimit usageCount').sort({ createdAt: -1 })

        const available = coupons.filter(c => c.usageLimit === null || c.usageCount < c.usageLimit)

        return response.json({ message: 'Active coupons', error: false, success: true, data: available })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllCouponsController(request, response) {
    try {
        const coupons = await CouponModel.find().sort({ createdAt: -1 })
        return response.json({ message: 'All coupons', error: false, success: true, data: coupons })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function createCouponController(request, response) {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, isActive, expiresAt, usageLimit } = request.body

        if (!code) {
            return response.status(400).json({ message: 'Coupon code is required', error: true, success: false })
        }

        const isFreeShipping = discountType === 'free_shipping'
        if (!isFreeShipping && (discountValue === undefined || discountValue === '' || discountValue === null)) {
            return response.status(400).json({ message: 'Discount value is required', error: true, success: false })
        }

        const existing = await CouponModel.findOne({ code: code.toUpperCase().trim() })
        if (existing) {
            return response.status(400).json({ message: 'Coupon code already exists', error: true, success: false })
        }

        const coupon = new CouponModel({
            code: code.toUpperCase().trim(),
            discountType: discountType || 'percentage',
            discountValue: isFreeShipping ? 0 : Number(discountValue),
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            usageCount: 0,
            isActive: isActive !== undefined ? isActive : true,
            expiresAt: expiresAt || null,
        })

        await coupon.save()

        // Auto-register this coupon as a Razorpay Offer so it appears in the checkout popup
        const rzOffer = await createRazorpayOffer(coupon)
        if (rzOffer?.id) {
            coupon.razorpayOfferId = rzOffer.id
            await coupon.save()
            console.log(`[Razorpay Offer] Created offer ${rzOffer.id} for coupon ${coupon.code}`)
        }

        return response.json({ message: 'Coupon created successfully', error: false, success: true, data: coupon })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function updateCouponController(request, response) {
    try {
        const { _id, code, discountType, discountValue, minOrderAmount, maxDiscount, isActive, expiresAt, usageLimit } = request.body

        if (!_id) {
            return response.status(400).json({ message: 'Coupon ID is required', error: true, success: false })
        }

        const updateData = {}
        if (code) updateData.code = code.toUpperCase().trim()
        if (discountType) updateData.discountType = discountType
        if (discountValue !== undefined) updateData.discountValue = discountType === 'free_shipping' ? 0 : Number(discountValue)
        if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount)
        if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null
        if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? Number(usageLimit) : null
        if (isActive !== undefined) updateData.isActive = isActive
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt || null

        const existing = await CouponModel.findById(_id)
        const updated  = await CouponModel.findByIdAndUpdate(_id, updateData, { new: true })

        // If admin deactivated the coupon, also deactivate the Razorpay offer
        if (isActive === false && existing?.razorpayOfferId) {
            await deactivateRazorpayOffer(existing.razorpayOfferId)
        }

        return response.json({ message: 'Coupon updated successfully', error: false, success: true, data: updated })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function deleteCouponController(request, response) {
    try {
        const { _id } = request.body
        if (!_id) {
            return response.status(400).json({ message: 'Coupon ID is required', error: true, success: false })
        }
        const coupon = await CouponModel.findById(_id)
        if (coupon?.razorpayOfferId) await deactivateRazorpayOffer(coupon.razorpayOfferId)
        await CouponModel.findByIdAndDelete(_id)
        return response.json({ message: 'Coupon deleted successfully', error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// Sync all existing coupons (no razorpayOfferId yet) with Razorpay Offers
export async function syncCouponsToRazorpayController(request, response) {
    try {
        const now = new Date()
        const coupons = await CouponModel.find({
            isActive: true,
            razorpayOfferId: { $in: [null, undefined, ''] },
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        })

        const results = []
        for (const coupon of coupons) {
            const rzOffer = await createRazorpayOffer(coupon)
            if (rzOffer?.id) {
                coupon.razorpayOfferId = rzOffer.id
                await coupon.save()
                results.push({ code: coupon.code, offerId: rzOffer.id, status: 'synced' })
                console.log(`[Razorpay Sync] ${coupon.code} → offer ${rzOffer.id}`)
            } else {
                results.push({ code: coupon.code, status: 'failed' })
            }
        }

        return response.json({ message: 'Sync complete', error: false, success: true, data: results })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
