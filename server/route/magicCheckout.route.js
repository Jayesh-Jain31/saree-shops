import { Router } from 'express'
import {
    shippingInfoController,
    getPromotionsController,
    applyPromotionController,
    abandonedCheckoutWebhookController,
} from '../controllers/magicCheckout.controller.js'

const magicCheckoutRouter = Router()

// Razorpay calls these directly — no auth middleware needed
magicCheckoutRouter.post('/shipping-info',        shippingInfoController)
magicCheckoutRouter.post('/promotions',            getPromotionsController)
magicCheckoutRouter.post('/apply-promotion',       applyPromotionController)
magicCheckoutRouter.post('/abandoned-checkout',    abandonedCheckoutWebhookController)

export default magicCheckoutRouter
