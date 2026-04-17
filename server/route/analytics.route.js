import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { getAnalyticsController, getAllOrdersAdminController, updateOrderStatusAdminController, getOrderDetailAdminController, getCustomerDetailAdmin, toggleCustomerCOD, updateCustomerStatus, adminWalletAdjust } from '../controllers/analytics.controller.js'

const analyticsRouter = Router()

analyticsRouter.get("/dashboard", auth, admin, getAnalyticsController)
analyticsRouter.post("/orders", auth, admin, getAllOrdersAdminController)
analyticsRouter.put("/order-status", auth, admin, updateOrderStatusAdminController)
analyticsRouter.get("/order-detail", auth, admin, getOrderDetailAdminController)
analyticsRouter.get("/customer/:userId", auth, admin, getCustomerDetailAdmin)
analyticsRouter.put("/customer/:userId/cod", auth, admin, toggleCustomerCOD)
analyticsRouter.put("/customer/:userId/status", auth, admin, updateCustomerStatus)
analyticsRouter.post("/customer/:userId/wallet", auth, admin, adminWalletAdjust)

export default analyticsRouter
