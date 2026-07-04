import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { listFiles, suggestEdit, applyEdit } from '../controllers/codeAgent.controller.js'

const codeAgentRouter = Router()

codeAgentRouter.get('/files', auth, admin, listFiles)
codeAgentRouter.post('/suggest', auth, admin, suggestEdit)
codeAgentRouter.post('/apply', auth, admin, applyEdit)

export default codeAgentRouter
