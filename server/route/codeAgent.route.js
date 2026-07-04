import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    listFiles,
    newSession,
    getSessionData,
    chat,
    applyBatch,
    undoChange,
} from '../controllers/codeAgent.controller.js'

const codeAgentRouter = Router()

codeAgentRouter.get('/files',          auth, admin, listFiles)
codeAgentRouter.post('/session/new',   auth, admin, newSession)
codeAgentRouter.get('/session/:id',    auth, admin, getSessionData)
codeAgentRouter.post('/chat',          auth, admin, chat)
codeAgentRouter.post('/apply-batch',   auth, admin, applyBatch)
codeAgentRouter.post('/undo',          auth, admin, undoChange)

export default codeAgentRouter
