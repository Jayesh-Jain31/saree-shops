import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { getSettingsController, updateSettingController } from '../controllers/settings.controller.js'

const settingsRouter = Router()

settingsRouter.get('/get', getSettingsController)
settingsRouter.put('/update', auth, admin, updateSettingController)

export default settingsRouter
