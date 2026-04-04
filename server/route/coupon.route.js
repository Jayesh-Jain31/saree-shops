import { Router } from 'express'
import auth from '../middleware/auth.js'
import { validateCouponController } from '../controllers/coupon.controller.js'

const couponRouter = Router()

couponRouter.post('/validate', auth, validateCouponController)

export default couponRouter
