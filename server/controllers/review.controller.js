import ReviewModel from "../models/review.model.js";
import ProductModel from "../models/product.model.js";
import OrderItemRatingModel from "../models/orderItemRating.model.js";

export async function addReviewController(request, response) {
    try {
        const userId = request.userId
        const { productId, rating, comment, orderId } = request.body

        if (!productId || !rating) {
            return response.status(400).json({ message: "Product ID and rating required", error: true, success: false })
        }

        if (rating < 1 || rating > 5) {
            return response.status(400).json({ message: "Rating must be between 1 and 5", error: true, success: false })
        }

        // Upsert global product review (one per user per product)
        const existing = await ReviewModel.findOne({ userId, productId })
        if (existing) {
            existing.rating = rating
            existing.comment = comment || ""
            await existing.save()
        } else {
            await ReviewModel.create({ userId, productId, rating, comment: comment || "" })
        }

        // Upsert per-order item rating tracking
        if (orderId) {
            await OrderItemRatingModel.findOneAndUpdate(
                { userId, orderId, productId },
                { rating },
                { upsert: true, new: true }
            )
        }

        // Recalculate and sync avgRating + reviewCount to product
        const allReviews = await ReviewModel.find({ productId })
        const reviewCount = allReviews.length
        const avgRating = reviewCount > 0
            ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
            : 0
        await ProductModel.findByIdAndUpdate(productId, { avgRating, reviewCount })

        return response.json({
            message: existing ? "Review updated" : "Review added",
            error: false,
            success: true,
            data: { avgRating, reviewCount }
        })

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getProductReviewsController(request, response) {
    try {
        const { productId } = request.body

        if (!productId) {
            return response.status(400).json({ message: "Product ID required", error: true, success: false })
        }

        const reviews = await ReviewModel.find({ productId })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })

        const totalReviews = reviews.length
        const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0

        return response.json({
            message: "Product reviews",
            data: { reviews, totalReviews, avgRating: Number(avgRating) },
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// Returns { [productId]: rating } for a specific order — used to persist rating state across refreshes
export async function getOrderRatingsController(request, response) {
    try {
        const userId = request.userId
        const { orderId } = request.params

        if (!orderId) {
            return response.status(400).json({ message: "Order ID required", error: true, success: false })
        }

        const ratings = await OrderItemRatingModel.find({ userId, orderId }, { productId: 1, rating: 1, _id: 0 }).lean()
        const map = {}
        ratings.forEach(r => { map[String(r.productId)] = r.rating })

        return response.json({ message: "Order ratings", data: map, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

// Returns all productIds the current user has reviewed
export async function getMyReviewedProductsController(request, response) {
    try {
        const userId = request.userId
        const reviews = await ReviewModel.find({ userId }, { productId: 1, rating: 1, _id: 0 }).lean()
        const map = {}
        reviews.forEach(r => { map[String(r.productId)] = r.rating })
        return response.json({ message: "My reviews", data: map, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function deleteReviewController(request, response) {
    try {
        const userId = request.userId
        const { reviewId } = request.body

        const review = await ReviewModel.findOne({ _id: reviewId, userId })
        if (!review) {
            return response.status(404).json({ message: "Review not found", error: true, success: false })
        }

        await ReviewModel.deleteOne({ _id: reviewId })
        return response.json({ message: "Review deleted", error: false, success: true })

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
