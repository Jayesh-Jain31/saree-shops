import { Router } from 'express'
import auth from '../middleware/auth.js'
import { addReviewController, getProductReviewsController, deleteReviewController, getMyReviewedProductsController } from '../controllers/review.controller.js'

const reviewRouter = Router()

reviewRouter.post("/add", auth, addReviewController)
reviewRouter.post("/get", getProductReviewsController)
reviewRouter.get("/my-reviews", auth, getMyReviewedProductsController)
reviewRouter.delete("/delete", auth, deleteReviewController)

export default reviewRouter
