import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    CashOnDeliveryOrderController,
    getOrderDetailsController,
    paymentController,
    webhookStripe,
    razorpayOrderController,
    razorpayVerifyController,
} from '../controllers/order.controller.js'

const orderRouter = Router()

orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController)
orderRouter.post('/checkout', auth, paymentController)
orderRouter.post('/webhook', webhookStripe)
orderRouter.get("/order-list", auth, getOrderDetailsController)

// Razorpay
orderRouter.post('/razorpay', auth, razorpayOrderController)
orderRouter.post('/razorpay-verify', auth, razorpayVerifyController)

export default orderRouter
