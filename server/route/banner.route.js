import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    getBannersController,
    getAllBannersAdminController,
    createBannerController,
    updateBannerController,
    deleteBannerController,
} from '../controllers/banner.controller.js'

const bannerRouter = Router()

bannerRouter.get('/get', getBannersController)
bannerRouter.get('/all', auth, admin, getAllBannersAdminController)
bannerRouter.post('/create', auth, admin, createBannerController)
bannerRouter.put('/update/:id', auth, admin, updateBannerController)
bannerRouter.delete('/delete/:id', auth, admin, deleteBannerController)

export default bannerRouter
