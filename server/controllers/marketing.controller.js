import BackInStockModel from '../models/backInStock.model.js'
import ProductModel from '../models/product.model.js'
import UserModel from '../models/user.model.js'
import OrderModel from '../models/order.model.js'
import ReviewModel from '../models/review.model.js'
import sendEmail from '../config/sendEmail.js'
import { sendFreeTextWhatsApp } from '../utils/whatsapp.js'

// ─── Back-in-Stock: Customer Subscribe ────────────────────────────────────────
export async function subscribeBackInStock(req, res) {
    try {
        const { productId } = req.body
        const userId = req.userId
        if (!productId) return res.status(400).json({ message: 'productId required', error: true, success: false })

        const user = await UserModel.findById(userId).select('name email mobile').lean()
        if (!user) return res.status(404).json({ message: 'User not found', error: true, success: false })

        const existing = await BackInStockModel.findOne({ productId, userId })
        if (existing) return res.json({ message: "You're already on the notify list!", success: true, error: false })

        await BackInStockModel.create({ productId, userId, mobile: user.mobile, email: user.email })
        return res.json({ message: "You'll be notified when it's back in stock!", success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

// ─── Back-in-Stock: Admin — list products with subscribers ────────────────────
export async function backInStockSubscribersAdmin(req, res) {
    try {
        const agg = await BackInStockModel.aggregate([
            { $match: { notified: false } },
            { $group: { _id: '$productId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 30 },
            {
                $lookup: {
                    from: 'products', localField: '_id', foreignField: '_id',
                    as: 'product',
                    pipeline: [{ $project: { name: 1, image: 1, stock: 1 } }]
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmpty: true } }
        ])
        return res.json({ data: agg, success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

// ─── Back-in-Stock: Admin — trigger notify for a product ─────────────────────
export async function triggerBackInStockNotify(req, res) {
    try {
        const { productId } = req.body
        if (!productId) return res.status(400).json({ message: 'productId required', error: true, success: false })

        const product = await ProductModel.findById(productId).select('name stock').lean()
        if (!product) return res.status(404).json({ message: 'Product not found', error: true, success: false })

        await notifyBackInStockSubscribers(productId, product.name)
        return res.json({ message: `Notifications sent for "${product.name}"`, success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

// ─── Back-in-Stock: Internal helper (called from product controller) ──────────
export async function notifyBackInStockSubscribers(productId, productName) {
    try {
        const subs = await BackInStockModel.find({ productId, notified: false }).lean()
        if (!subs.length) return

        const productUrl = process.env.STORE_URL || ''
        const msg = `🎉 Good news! *${productName}* is back in stock!\n\nShop now before it sells out again → ${productUrl}`

        for (const sub of subs) {
            try {
                if (sub.mobile) await sendFreeTextWhatsApp(sub.mobile, msg)
                if (sub.email) await sendEmail({
                    sendTo: sub.email,
                    subject: `${productName} is back in stock!`,
                    html: `<p>Great news! <strong>${productName}</strong> is back in stock. <a href="${productUrl}">Shop now</a> before it sells out again!</p>`
                })
                await BackInStockModel.updateOne({ _id: sub._id }, { notified: true, notifiedAt: new Date() })
            } catch {}
        }
        console.log(`[BackInStock] Notified ${subs.length} subscriber(s) for "${productName}"`)
    } catch (err) {
        console.error('[BackInStock] Notify error:', err.message)
    }
}

// ─── Email Newsletter Blast ───────────────────────────────────────────────────
export async function emailNewsletterController(req, res) {
    try {
        const { subject, html, text } = req.body
        if (!subject?.trim()) return res.status(400).json({ message: 'Subject required', error: true, success: false })
        if (!html?.trim() && !text?.trim()) return res.status(400).json({ message: 'Email body required', error: true, success: false })

        const users = await UserModel.find({ email: { $ne: null, $ne: '' }, status: 'Active' }).select('name email').lean()
        let sent = 0, failed = 0

        const emailHtml = html?.trim() || `<p>${text}</p>`

        for (const user of users) {
            try {
                const personalised = emailHtml
                    .replace(/{{name}}/gi, user.name || 'Customer')
                    .replace(/{{email}}/gi, user.email)
                await sendEmail({ sendTo: user.email, subject, html: personalised })
                sent++
                await new Promise(r => setTimeout(r, 80))
            } catch { failed++ }
        }

        return res.json({
            message: `Newsletter sent — ✅ ${sent} delivered, ❌ ${failed} failed`,
            data: { total: users.length, sent, failed },
            success: true, error: false
        })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

// ─── Win-Back Campaign ────────────────────────────────────────────────────────
export async function winBackController(req, res) {
    try {
        const { days = 30, message: customMsg } = req.body
        const daysNum = parseInt(days) || 30
        const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000)

        const recentUserIds = await OrderModel.distinct('userId', { createdAt: { $gt: cutoff } })
        const recentSet = new Set(recentUserIds.map(String))

        const oldUserIds = await OrderModel.distinct('userId', { createdAt: { $lte: cutoff } })
        const lapsedIds = oldUserIds.filter(id => !recentSet.has(String(id)))

        if (!lapsedIds.length) return res.json({
            message: 'No lapsed customers found',
            data: { total: 0, sent: 0, failed: 0 },
            success: true, error: false
        })

        const users = await UserModel.find({
            _id: { $in: lapsedIds },
            status: 'Active'
        }).select('name email mobile').lean()

        const defaultMsg = `💖 Hi {{name}}, we miss you at our store!\n\nIt's been a while since your last order. Come back and discover our latest saree collection — we have something special waiting for you! 🛍️`
        const msgTemplate = customMsg?.trim() || defaultMsg

        let sent = 0, failed = 0

        for (const user of users) {
            try {
                const personalised = msgTemplate.replace(/{{name}}/gi, user.name || 'there')
                let ok = false
                if (user.mobile) { try { await sendFreeTextWhatsApp(user.mobile, personalised); ok = true } catch {} }
                if (user.email) {
                    try {
                        await sendEmail({
                            sendTo: user.email,
                            subject: 'We miss you! Come back for something special 💖',
                            html: `<p>${personalised.replace(/\n/g, '<br/>')}</p>`
                        })
                        ok = true
                    } catch {}
                }
                ok ? sent++ : failed++
                await new Promise(r => setTimeout(r, 100))
            } catch { failed++ }
        }

        return res.json({
            message: `Win-back campaign done — ✅ ${sent} reached, ❌ ${failed} failed`,
            data: { total: users.length, sent, failed, daysNum },
            success: true, error: false
        })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

// ─── Review Request ───────────────────────────────────────────────────────────
export async function reviewRequestController(req, res) {
    try {
        const { daysAfterDelivery = 3, message: customMsg } = req.body
        const daysNum = parseInt(daysAfterDelivery) || 3
        const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000)

        const deliveredOrders = await OrderModel.find({
            orderStatus: 'Delivered',
            deliveredAt: { $ne: null, $lte: cutoff },
            reviewRequested: { $ne: true }
        }).populate('userId', 'name email mobile').lean()

        if (!deliveredOrders.length) return res.json({
            message: 'No eligible orders found',
            data: { total: 0, sent: 0, failed: 0 },
            success: true, error: false
        })

        const orderIds = deliveredOrders.map(o => o._id)
        const alreadyReviewed = await ReviewModel.distinct('userId', {
            productId: { $in: deliveredOrders.flatMap(o => o.items.map(i => i.productId)) }
        })
        const reviewedSet = new Set(alreadyReviewed.map(String))

        const defaultMsg = `⭐ Hi {{name}}, how was your recent order from us?\n\nWe'd love to hear your feedback! Your review helps other shoppers and improves our service.\n\nTap here to leave a review: {{link}}`
        const msgTemplate = customMsg?.trim() || defaultMsg
        const storeUrl = process.env.STORE_URL || ''

        let sent = 0, failed = 0

        for (const order of deliveredOrders) {
            const user = order.userId
            if (!user || reviewedSet.has(String(user._id))) { continue }

            try {
                const personalised = msgTemplate
                    .replace(/{{name}}/gi, user.name || 'Customer')
                    .replace(/{{link}}/gi, `${storeUrl}/my-orders`)
                    .replace(/{{orderId}}/gi, order.orderId)

                let ok = false
                if (user.mobile) { try { await sendFreeTextWhatsApp(user.mobile, personalised); ok = true } catch {} }
                if (user.email) {
                    try {
                        await sendEmail({
                            sendTo: user.email,
                            subject: `How was your order? Leave a review ⭐`,
                            html: `<p>${personalised.replace(/\n/g, '<br/>')}</p>`
                        })
                        ok = true
                    } catch {}
                }

                if (ok) {
                    await OrderModel.updateOne({ _id: order._id }, { reviewRequested: true })
                    sent++
                } else { failed++ }

                await new Promise(r => setTimeout(r, 100))
            } catch { failed++ }
        }

        return res.json({
            message: `Review requests sent — ✅ ${sent} sent, ❌ ${failed} failed`,
            data: { total: deliveredOrders.length, sent, failed },
            success: true, error: false
        })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}
