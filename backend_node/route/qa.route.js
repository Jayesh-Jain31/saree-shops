import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { askQuestionController, getProductQAController, answerQuestionController, deleteQAController, getPendingQAController } from '../controllers/qa.controller.js'

const qaRouter = Router()

qaRouter.get('/product', getProductQAController)
qaRouter.post('/ask', auth, askQuestionController)
qaRouter.put('/:qaId/answer', auth, admin, answerQuestionController)
qaRouter.delete('/:qaId', auth, admin, deleteQAController)
qaRouter.get('/pending', auth, admin, getPendingQAController)

export default qaRouter
