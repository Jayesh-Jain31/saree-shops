import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { getAnalyticsController, getAllOrdersAdminController, updateOrderStatusAdminController } from '../controllers/analytics.controller.js'

const analyticsRouter = Router()

analyticsRouter.get("/dashboard", auth, admin, getAnalyticsController)
analyticsRouter.post("/orders", auth, admin, getAllOrdersAdminController)
analyticsRouter.put("/order-status", auth, admin, updateOrderStatusAdminController)

export default analyticsRouter
