import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    getActiveFreeGift,
    getFreeGiftProgress,
    getAllFreeGifts,
    createFreeGift,
    updateFreeGift,
    toggleFreeGift,
    deleteFreeGift,
} from '../controllers/freeGift.controller.js'

const freeGiftRouter = Router()

freeGiftRouter.get('/active',          getActiveFreeGift)
freeGiftRouter.get('/progress',        getFreeGiftProgress)
freeGiftRouter.get('/all',             auth, admin, getAllFreeGifts)
freeGiftRouter.post('/create',         auth, admin, createFreeGift)
freeGiftRouter.put('/update/:id',      auth, admin, updateFreeGift)
freeGiftRouter.put('/toggle/:id',      auth, admin, toggleFreeGift)
freeGiftRouter.delete('/delete/:id',   auth, admin, deleteFreeGift)

export default freeGiftRouter
