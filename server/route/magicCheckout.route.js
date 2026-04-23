import { Router } from 'express'
import {
    shippingInfoController,
    getPromotionsController,
    applyPromotionController,
} from '../controllers/magicCheckout.controller.js'

const magicCheckoutRouter = Router()

// Razorpay calls these endpoints directly — no auth middleware needed
magicCheckoutRouter.post('/shipping-info',    shippingInfoController)
magicCheckoutRouter.post('/promotions',       getPromotionsController)
magicCheckoutRouter.post('/apply-promotion',  applyPromotionController)

export default magicCheckoutRouter
