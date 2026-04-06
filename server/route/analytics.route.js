import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { getAnalyticsController, getAllOrdersAdminController, updateOrderStatusAdminController, getOrderDetailAdminController } from '../controllers/analytics.controller.js'

const analyticsRouter = Router()

analyticsRouter.get("/dashboard", auth, admin, getAnalyticsController)
analyticsRouter.post("/orders", auth, admin, getAllOrdersAdminController)
analyticsRouter.put("/order-status", auth, admin, updateOrderStatusAdminController)
analyticsRouter.get("/order-detail", auth, admin, getOrderDetailAdminController)

export default analyticsRouter
