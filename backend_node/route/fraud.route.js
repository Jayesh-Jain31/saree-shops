import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    getFraudFlags,
    getFraudStats,
    updateFraudFlag,
    runUserFraudScan,
    deleteFraudFlag,
} from '../controllers/fraud.controller.js'

const fraudRouter = Router()

fraudRouter.get('/flags',     auth, admin, getFraudFlags)
fraudRouter.get('/stats',     auth, admin, getFraudStats)
fraudRouter.put('/flags/:id', auth, admin, updateFraudFlag)
fraudRouter.delete('/flags/:id', auth, admin, deleteFraudFlag)
fraudRouter.post('/scan-users', auth, admin, runUserFraudScan)

export default fraudRouter
