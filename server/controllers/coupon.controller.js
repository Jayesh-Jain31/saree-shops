import CouponModel from '../models/coupon.model.js'

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
