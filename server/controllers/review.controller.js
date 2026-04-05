import ReviewModel from "../models/review.model.js";

export async function addReviewController(request, response) {
    try {
        const userId = request.userId
        const { productId, rating, comment } = request.body

        if (!productId || !rating) {
            return response.status(400).json({ message: "Product ID and rating required", error: true, success: false })
        }

        if (rating < 1 || rating > 5) {
            return response.status(400).json({ message: "Rating must be between 1 and 5", error: true, success: false })
        }

        const existing = await ReviewModel.findOne({ userId, productId })

        if (existing) {
            existing.rating = rating
            existing.comment = comment || ""
            await existing.save()
            return response.json({ message: "Review updated", data: existing, error: false, success: true })
        }

        const review = await ReviewModel.create({ userId, productId, rating, comment: comment || "" })
        return response.json({ message: "Review added", data: review, error: false, success: true })

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
