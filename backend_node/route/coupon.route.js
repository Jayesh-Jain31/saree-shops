import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    validateCouponController,
    getActiveCouponsPublic,
    getAllCouponsController,
    createCouponController,
    updateCouponController,
    deleteCouponController,
} from '../controllers/coupon.controller.js'

const couponRouter = Router()

// Public (no auth needed)
couponRouter.get('/active', getActiveCouponsPublic)

// User
couponRouter.post('/validate', auth, validateCouponController)

// Admin
couponRouter.get('/all', auth, admin, getAllCouponsController)
couponRouter.post('/create', auth, admin, createCouponController)
couponRouter.put('/update', auth, admin, updateCouponController)
couponRouter.delete('/delete', auth, admin, deleteCouponController)

export default couponRouter
