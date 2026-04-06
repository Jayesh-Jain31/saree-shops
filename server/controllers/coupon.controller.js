import CouponModel from '../models/coupon.model.js'
import OrderModel from '../models/order.model.js'

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

        const updated = await CouponModel.findByIdAndUpdate(_id, updateData, { new: true })

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
        await CouponModel.findByIdAndDelete(_id)
        return response.json({ message: 'Coupon deleted successfully', error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
