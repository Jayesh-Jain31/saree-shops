import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { listFiles, suggestEdit, applyEdit, undoEdit } from '../controllers/codeAgent.controller.js'

const codeAgentRouter = Router()

codeAgentRouter.get('/files', auth, admin, listFiles)
codeAgentRouter.post('/suggest', auth, admin, suggestEdit)
codeAgentRouter.post('/apply', auth, admin, applyEdit)
codeAgentRouter.post('/undo', auth, admin, undoEdit)

export default codeAgentRouter
