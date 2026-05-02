import FreeGiftModel from '../models/freeGift.model.js'
import ProductModel from '../models/product.model.js'

const POPULATE = 'name image price discount'

// ── Internal helper used by order controllers ─────────────────────────────────
export async function getActiveFreeGiftInternal(cartAmount = 0) {
    try {
        const now = new Date()
        const gift = await FreeGiftModel.findOne({
            isActive: true,
            minOrderAmount: { $lte: cartAmount },
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
            $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
        })
            .populate('productId', POPULATE)
            .sort({ createdAt: -1 })
            .lean()
        return gift?.productId ? gift : null
    } catch { return null }
}

// GET /api/free-gift/active?cartAmount=X  (public, no auth)
export async function getActiveFreeGift(req, res) {
    try {
        const cartAmount = parseFloat(req.query.cartAmount) || 0
        const gift = await getActiveFreeGiftInternal(cartAmount)
        return res.json({ success: true, data: gift || null })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// GET /api/free-gift/all  (admin)
export async function getAllFreeGifts(req, res) {
    try {
        const gifts = await FreeGiftModel.find()
            .populate('productId', POPULATE)
            .sort({ createdAt: -1 })
            .lean()
        return res.json({ success: true, data: gifts })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// POST /api/free-gift/create  (admin)
export async function createFreeGift(req, res) {
    try {
        const { productId, title, minOrderAmount, isActive, startDate, endDate } = req.body
        if (!productId) return res.status(400).json({ success: false, message: 'Product is required' })
        const product = await ProductModel.findById(productId)
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

        const gift = await FreeGiftModel.create({
            productId,
            title: title || 'Free Gift with your order!',
            minOrderAmount: Number(minOrderAmount) || 0,
            isActive: isActive !== false,
            startDate: startDate || null,
            endDate: endDate || null,
        })
        await gift.populate('productId', POPULATE)
        return res.json({ success: true, data: gift, message: 'Free gift offer created!' })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// PUT /api/free-gift/update/:id  (admin)
export async function updateFreeGift(req, res) {
    try {
        const { id } = req.params
        const { productId, title, minOrderAmount, isActive, startDate, endDate } = req.body
        const gift = await FreeGiftModel.findByIdAndUpdate(
            id,
            { productId, title, minOrderAmount: Number(minOrderAmount) || 0, isActive, startDate: startDate || null, endDate: endDate || null },
            { new: true }
        ).populate('productId', POPULATE)
        if (!gift) return res.status(404).json({ success: false, message: 'Gift not found' })
        return res.json({ success: true, data: gift, message: 'Updated!' })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// PUT /api/free-gift/toggle/:id  (admin)
export async function toggleFreeGift(req, res) {
    try {
        const { id } = req.params
        const gift = await FreeGiftModel.findById(id)
        if (!gift) return res.status(404).json({ success: false, message: 'Gift not found' })
        gift.isActive = !gift.isActive
        await gift.save()
        await gift.populate('productId', POPULATE)
        return res.json({ success: true, data: gift, message: gift.isActive ? 'Gift activated!' : 'Gift deactivated!' })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// DELETE /api/free-gift/delete/:id  (admin)
export async function deleteFreeGift(req, res) {
    try {
        const { id } = req.params
        await FreeGiftModel.findByIdAndDelete(id)
        return res.json({ success: true, message: 'Free gift offer deleted!' })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}
