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

// GET /api/free-gift/progress?cartAmount=X  (public, no auth)
// Returns the best active offer for progress-bar display, even if cart hasn't qualified yet.
export async function getFreeGiftProgress(req, res) {
    try {
        const cartAmount = parseFloat(req.query.cartAmount) || 0
        const now = new Date()

        // Find all active, date-valid gifts, pick the one with the lowest threshold >= cartAmount (next to unlock)
        // or the highest threshold <= cartAmount (already unlocked)
        const allGifts = await FreeGiftModel.find({
            isActive: true,
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
            $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
        }).populate('productId', 'name image price').sort({ minOrderAmount: 1 }).lean()

        if (!allGifts.length) return res.json({ success: true, data: null })

        // Prefer the gift that the cart has just unlocked or is closest to unlocking
        const qualified = allGifts.filter(g => g.minOrderAmount <= cartAmount && g.productId)
        const upcoming  = allGifts.filter(g => g.minOrderAmount > cartAmount && g.productId)

        let gift = null
        let isQualified = false

        if (qualified.length) {
            // Show the highest-threshold unlocked gift (most relevant)
            gift = qualified[qualified.length - 1]
            isQualified = true
        } else if (upcoming.length) {
            // Show the closest upcoming gift
            gift = upcoming[0]
            isQualified = false
        }

        if (!gift) return res.json({ success: true, data: null })

        const shortfall = Math.max(0, gift.minOrderAmount - cartAmount)
        const progress  = gift.minOrderAmount > 0
            ? Math.min(100, Math.round((cartAmount / gift.minOrderAmount) * 100))
            : 100

        return res.json({
            success: true,
            data: {
                ...gift,
                isQualified,
                shortfall,
                progress,
            }
        })
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
