import FreeGiftModel from '../models/freeGift.model.js'
import ProductModel from '../models/product.model.js'

const POPULATE = 'name image price discount'

// Normalise a FreeGift document so callers always get a `productId`-shaped object
// regardless of whether the gift uses a real product or customGift fields.
function normaliseGift(gift) {
    if (!gift) return null
    const g = gift.toObject ? gift.toObject() : { ...gift }

    if (!g.productId && g.customGift?.name) {
        g.productId = {
            _id:      g._id,
            name:     g.customGift.name,
            image:    g.customGift.image ? [g.customGift.image] : [],
            price:    g.customGift.price || 0,
            discount: 0,
        }
    }
    return g
}

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

        if (!gift) return null

        // For real-product gifts
        if (gift.productId) return gift

        // For custom gifts — synthesise a productId-shaped object
        if (gift.customGift?.name) {
            gift.productId = {
                _id:      gift._id,
                name:     gift.customGift.name,
                image:    gift.customGift.image ? [gift.customGift.image] : [],
                price:    gift.customGift.price || 0,
                discount: 0,
            }
            return gift
        }
        return null
    } catch { return null }
}

// GET /api/free-gift/active?cartAmount=X  (public)
export async function getActiveFreeGift(req, res) {
    try {
        const cartAmount = parseFloat(req.query.cartAmount) || 0
        const gift = await getActiveFreeGiftInternal(cartAmount)
        return res.json({ success: true, data: gift || null })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

// GET /api/free-gift/progress?cartAmount=X  (public)
export async function getFreeGiftProgress(req, res) {
    try {
        const cartAmount = parseFloat(req.query.cartAmount) || 0
        const now = new Date()

        const allGifts = await FreeGiftModel.find({
            isActive: true,
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
            $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }],
        }).populate('productId', 'name image price').sort({ minOrderAmount: 1 }).lean()

        if (!allGifts.length) return res.json({ success: true, data: null })

        const validGifts = allGifts.filter(g => g.productId || g.customGift?.name)
        if (!validGifts.length) return res.json({ success: true, data: null })

        const qualified = validGifts.filter(g => g.minOrderAmount <= cartAmount)
        const upcoming  = validGifts.filter(g => g.minOrderAmount > cartAmount)

        let gift = null
        let isQualified = false

        if (qualified.length) {
            gift = qualified[qualified.length - 1]
            isQualified = true
        } else if (upcoming.length) {
            gift = upcoming[0]
            isQualified = false
        }

        if (!gift) return res.json({ success: true, data: null })

        // Normalise custom gift
        if (!gift.productId && gift.customGift?.name) {
            gift.productId = {
                _id: gift._id, name: gift.customGift.name,
                image: gift.customGift.image ? [gift.customGift.image] : [],
                price: gift.customGift.price || 0,
            }
        }

        const shortfall = Math.max(0, gift.minOrderAmount - cartAmount)
        const progress  = gift.minOrderAmount > 0
            ? Math.min(100, Math.round((cartAmount / gift.minOrderAmount) * 100))
            : 100

        return res.json({
            success: true,
            data: { ...gift, isQualified, shortfall, progress }
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
        const { productId, customGift, title, minOrderAmount, isActive, startDate, endDate } = req.body

        const hasProduct    = productId && productId !== ''
        const hasCustomGift = customGift?.name && customGift?.image

        if (!hasProduct && !hasCustomGift) {
            return res.status(400).json({ success: false, message: 'Select an existing product or provide custom gift details (name + image).' })
        }

        if (hasProduct) {
            const product = await ProductModel.findById(productId)
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
        }

        const safeImage = (customGift?.image || '').replace(/^http:\/\//i, 'https://')
        const gift = await FreeGiftModel.create({
            productId:      hasProduct ? productId : null,
            customGift:     hasCustomGift ? { name: customGift.name, image: safeImage, price: Number(customGift.price) || 0 } : undefined,
            title:          title || 'Free Gift with your order!',
            minOrderAmount: Number(minOrderAmount) || 0,
            isActive:       isActive !== false,
            startDate:      startDate || null,
            endDate:        endDate || null,
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
        const { productId, customGift, title, minOrderAmount, isActive, startDate, endDate } = req.body

        const hasProduct    = productId && productId !== ''
        const hasCustomGift = customGift?.name && customGift?.image

        if (!hasProduct && !hasCustomGift) {
            return res.status(400).json({ success: false, message: 'Select an existing product or provide custom gift details.' })
        }

        const safeUpdateImage = (customGift?.image || '').replace(/^http:\/\//i, 'https://')
        const gift = await FreeGiftModel.findByIdAndUpdate(
            id,
            {
                productId:      hasProduct ? productId : null,
                customGift:     hasCustomGift ? { name: customGift.name, image: safeUpdateImage, price: Number(customGift.price) || 0 } : { name: '', image: '', price: 0 },
                title,
                minOrderAmount: Number(minOrderAmount) || 0,
                isActive,
                startDate: startDate || null,
                endDate:   endDate   || null,
            },
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
