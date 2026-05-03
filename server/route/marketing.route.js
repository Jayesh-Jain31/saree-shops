import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    subscribeBackInStock,
    backInStockSubscribersAdmin,
    triggerBackInStockNotify,
    emailNewsletterController,
    winBackController,
    reviewRequestController
} from '../controllers/marketing.controller.js'

const marketingRouter = Router()

marketingRouter.post('/back-in-stock/subscribe', auth, subscribeBackInStock)
marketingRouter.get('/back-in-stock/subscribers', auth, admin, backInStockSubscribersAdmin)
marketingRouter.post('/back-in-stock/notify', auth, admin, triggerBackInStockNotify)
marketingRouter.post('/newsletter', auth, admin, emailNewsletterController)
marketingRouter.post('/win-back', auth, admin, winBackController)
marketingRouter.post('/review-request', auth, admin, reviewRequestController)

export default marketingRouter
