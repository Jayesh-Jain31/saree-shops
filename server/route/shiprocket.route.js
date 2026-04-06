import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { createShiprocketOrder, getShiprocketTracking, getShiprocketWarehouses } from '../controllers/shiprocket.controller.js'

const shiprocketRouter = Router()

shiprocketRouter.post('/create-order', auth, admin, createShiprocketOrder)
shiprocketRouter.get('/track', auth, admin, getShiprocketTracking)
shiprocketRouter.get('/warehouses', auth, admin, getShiprocketWarehouses)

export default shiprocketRouter
