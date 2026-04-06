import { Router } from "express"
import auth from "../middleware/auth.js"
import { admin } from "../middleware/Admin.js"
import {
    createReturnRequest,
    getMyReturns,
    getReturnByOrderId,
    getAllReturnsAdmin,
    updateReturnStatus
} from "../controllers/return.controller.js"

const returnRouter = Router()

returnRouter.post('/create', auth, createReturnRequest)
returnRouter.get('/my-returns', auth, getMyReturns)
returnRouter.get('/order/:orderId', auth, getReturnByOrderId)
returnRouter.get('/admin/all', auth, admin, getAllReturnsAdmin)
returnRouter.put('/admin/update/:returnId', auth, admin, updateReturnStatus)

export default returnRouter
