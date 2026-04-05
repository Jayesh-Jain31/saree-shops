import CouponModel from '../models/coupon.model.js'

// ─── Public ───────────────────────────────────────────────────────────────────

export async function validateCouponController(request, response) {
    try {
        const { code, orderAmount } = request.body

        if (!code) {
            return response.status(400).json({
                message: 'Coupon code is required',
                error: true,
                success: false,
            })
        }

        const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true })

        if (!coupon) {
            return response.status(404).json({
                message: 'Invalid or expired coupon code',
                error: true,
                success: false,
            })
        }

        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return response.status(400).json({
                message: 'This coupon has expired',
                error: true,
                success: false,
            })
        }

        if (orderAmount < coupon.minOrderAmount) {
            return response.status(400).json({
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
                error: true,
                success: false,
            })
        }

        let discountAmount = 0
        if (coupon.discountType === 'percentage') {
            discountAmount = Math.floor((orderAmount * coupon.discountValue) / 100)
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount)
            }
        } else {
            discountAmount = Math.min(coupon.discountValue, orderAmount)
        }

        const finalAmount = Math.max(0, orderAmount - discountAmount)

        return response.json({
            message: 'Coupon applied successfully!',
            error: false,
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                finalAmount,
            },
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllCouponsController(request, response) {
    try {
        const coupons = await CouponModel.find().sort({ createdAt: -1 })
        return response.json({
            message: 'All coupons',
            error: false,
            success: true,
            data: coupons,
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}

export async function createCouponController(request, response) {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, isActive, expiresAt } = request.body

        if (!code || !discountValue) {
            return response.status(400).json({
                message: 'Code and discount value are required',
                error: true,
                success: false,
            })
        }

        const existing = await CouponModel.findOne({ code: code.toUpperCase().trim() })
        if (existing) {
            return response.status(400).json({
                message: 'Coupon code already exists',
                error: true,
                success: false,
            })
        }

        const coupon = new CouponModel({
            code: code.toUpperCase().trim(),
            discountType: discountType || 'percentage',
            discountValue: Number(discountValue),
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            isActive: isActive !== undefined ? isActive : true,
            expiresAt: expiresAt || null,
        })

        await coupon.save()

        return response.json({
            message: 'Coupon created successfully',
            error: false,
            success: true,
            data: coupon,
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}

export async function updateCouponController(request, response) {
    try {
        const { _id, code, discountType, discountValue, minOrderAmount, maxDiscount, isActive, expiresAt } = request.body

        if (!_id) {
            return response.status(400).json({
                message: 'Coupon ID is required',
                error: true,
                success: false,
            })
        }

        const updateData = {}
        if (code) updateData.code = code.toUpperCase().trim()
        if (discountType) updateData.discountType = discountType
        if (discountValue !== undefined) updateData.discountValue = Number(discountValue)
        if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount)
        if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null
        if (isActive !== undefined) updateData.isActive = isActive
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt || null

        const updated = await CouponModel.findByIdAndUpdate(_id, updateData, { new: true })

        return response.json({
            message: 'Coupon updated successfully',
            error: false,
            success: true,
            data: updated,
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}

export async function deleteCouponController(request, response) {
    try {
        const { _id } = request.body

        if (!_id) {
            return response.status(400).json({
                message: 'Coupon ID is required',
                error: true,
                success: false,
            })
        }

        await CouponModel.findByIdAndDelete(_id)

        return response.json({
            message: 'Coupon deleted successfully',
            error: false,
            success: true,
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}
