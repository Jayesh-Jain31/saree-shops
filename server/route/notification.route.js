import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    getMyNotifications,
    markOneRead,
    markAllRead,
    clearAll,
    deleteOne,
} from '../controllers/notification.controller.js'

const notificationRouter = Router()

notificationRouter.get('/my',           auth, getMyNotifications)
notificationRouter.put('/read/:id',     auth, markOneRead)
notificationRouter.put('/read-all',     auth, markAllRead)
notificationRouter.delete('/clear',     auth, clearAll)
notificationRouter.delete('/:id',       auth, deleteOne)

export default notificationRouter
