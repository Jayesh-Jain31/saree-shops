import WishlistModel from "../models/wishlist.model.js";

export async function toggleWishlistController(request, response) {
    try {
        const userId = request.userId
        const { productId } = request.body

        if (!productId) {
            return response.status(400).json({ message: "Product ID required", error: true, success: false })
        }

        const existing = await WishlistModel.findOne({ userId, productId })

        if (existing) {
            await WishlistModel.deleteOne({ _id: existing._id })
            return response.json({ message: "Removed from wishlist", error: false, success: true, data: { added: false } })
        }

        await WishlistModel.create({ userId, productId })
        return response.json({ message: "Added to wishlist", error: false, success: true, data: { added: true } })

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getWishlistController(request, response) {
    try {
        const userId = request.userId
        const wishlist = await WishlistModel.find({ userId }).populate('productId').sort({ createdAt: -1 })
        return response.json({ message: "Wishlist", data: wishlist, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
