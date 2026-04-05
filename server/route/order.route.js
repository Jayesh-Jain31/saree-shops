import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    CashOnDeliveryOrderController,
    getOrderDetailsController,
    getOrderByIdController,
    cancelOrderController,
    razorpayOrderController,
    razorpayVerifyController,
} from '../controllers/order.controller.js'

const orderRouter = Router()

orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController)
orderRouter.get("/order-list", auth, getOrderDetailsController)
orderRouter.get("/order-details/:id", auth, getOrderByIdController)
orderRouter.put("/cancel/:id", auth, cancelOrderController)

orderRouter.post('/razorpay', auth, razorpayOrderController)
orderRouter.post('/razorpay-verify', auth, razorpayVerifyController)

export default orderRouter
