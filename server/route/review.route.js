import { Router } from 'express'
import auth from '../middleware/auth.js'
import { addReviewController, getProductReviewsController, deleteReviewController } from '../controllers/review.controller.js'

const reviewRouter = Router()

reviewRouter.post("/add", auth, addReviewController)
reviewRouter.post("/get", getProductReviewsController)
reviewRouter.delete("/delete", auth, deleteReviewController)

export default reviewRouter
