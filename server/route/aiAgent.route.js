import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { aiAgentChat } from '../controllers/aiAgent.controller.js'

const aiAgentRouter = Router()

aiAgentRouter.post('/chat', auth, admin, aiAgentChat)

export default aiAgentRouter
