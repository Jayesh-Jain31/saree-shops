import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    CashOnDeliveryOrderController,
    WalletOrderController,
    getOrderDetailsController,
    getOrderByIdController,
    cancelOrderController,
    razorpayOrderController,
    razorpayVerifyController,
    partialCodOrderController,
    partialCodVerifyController,
    updateOrderAddressController,
} from '../controllers/order.controller.js'

const orderRouter = Router()

orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController)
orderRouter.post("/wallet", auth, WalletOrderController)
orderRouter.get("/order-list", auth, getOrderDetailsController)
orderRouter.get("/order-details/:id", auth, getOrderByIdController)
orderRouter.put("/cancel/:id", auth, cancelOrderController)
orderRouter.put("/update-address/:id", auth, updateOrderAddressController)

orderRouter.post('/razorpay', auth, razorpayOrderController)
orderRouter.post('/razorpay-verify', auth, razorpayVerifyController)

orderRouter.post('/partial-cod', auth, partialCodOrderController)
orderRouter.post('/partial-cod-verify', auth, partialCodVerifyController)

export default orderRouter
