import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    getMyLoyalty,
    getMyPendingLoyalty,
    redeemPreview,
    getAllLoyalty,
    adminAdjustPoints
} from '../controllers/loyalty.controller.js'

const loyaltyRouter = Router()

loyaltyRouter.get('/my', auth, getMyLoyalty)
loyaltyRouter.get('/my-pending', auth, getMyPendingLoyalty)
loyaltyRouter.post('/redeem-preview', auth, redeemPreview)
loyaltyRouter.get('/admin/all', auth, admin, getAllLoyalty)
loyaltyRouter.post('/admin/adjust', auth, admin, adminAdjustPoints)

export default loyaltyRouter
