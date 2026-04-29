import { Router } from 'express'
import auth from '../middleware/auth.js'
import { toggleWishlistController, getWishlistController } from '../controllers/wishlist.controller.js'

const wishlistRouter = Router()

wishlistRouter.post("/toggle", auth, toggleWishlistController)
wishlistRouter.get("/get", auth, getWishlistController)

export default wishlistRouter
