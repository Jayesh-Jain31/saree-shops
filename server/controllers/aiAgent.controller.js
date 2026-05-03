import { GoogleGenerativeAI } from '@google/generative-ai'
import OrderModel from '../models/order.model.js'
import ProductModel from '../models/product.model.js'
import UserModel from '../models/user.model.js'
import CouponModel from '../models/coupon.model.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function gatherStoreContext() {
    const now = new Date()
    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart   = new Date(now - 7  * 24 * 60 * 60 * 1000)
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
        todayOrders, weekOrders, monthOrders, totalOrders,
        pendingOrders, confirmedOrders, shippedOrders,
        totalProducts, totalCustomers,
        recentOrders, topProducts,
        todayRev, weekRev, monthRev, totalRev,
        lowStockProducts, activeCoupons,
    ] = await Promise.all([
        OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
        OrderModel.countDocuments({ createdAt: { $gte: weekStart } }),
        OrderModel.countDocuments({ createdAt: { $gte: monthStart } }),
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({ orderStatus: 'Pending' }),
        OrderModel.countDocuments({ orderStatus: 'Confirmed' }),
        OrderModel.countDocuments({ orderStatus: 'Shipped' }),
        ProductModel.countDocuments({ publish: true }),
        UserModel.countDocuments({ role: 'USER' }),
        OrderModel.find({}).sort({ createdAt: -1 }).limit(8)
            .select('orderId orderStatus totalAmt createdAt payment_status delivery_address_snapshot'),
        OrderModel.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.isFreeGift': { $ne: true } } },
            { $group: { _id: '$items.product_details.name', orders: { $sum: 1 } } },
            { $sort: { orders: -1 } }, { $limit: 5 },
        ]),
        OrderModel.aggregate([{ $match: { createdAt: { $gte: todayStart }, payment_status: 'PAID' } }, { $group: { _id: null, t: { $sum: '$totalAmt' } } }]),
        OrderModel.aggregate([{ $match: { createdAt: { $gte: weekStart  }, payment_status: 'PAID' } }, { $group: { _id: null, t: { $sum: '$totalAmt' } } }]),
        OrderModel.aggregate([{ $match: { createdAt: { $gte: monthStart }, payment_status: 'PAID' } }, { $group: { _id: null, t: { $sum: '$totalAmt' } } }]),
        OrderModel.aggregate([{ $match: { payment_status: 'PAID' } },                                  { $group: { _id: null, t: { $sum: '$totalAmt' } } }]),
        ProductModel.find({ stock: { $lt: 5 }, publish: true }).select('name stock').limit(5),
        CouponModel.countDocuments({ isActive: true }),
    ])

    return {
        orders: { today: todayOrders, thisWeek: weekOrders, thisMonth: monthOrders, total: totalOrders, pending: pendingOrders, confirmed: confirmedOrders, shipped: shippedOrders },
        revenue: { today: todayRev[0]?.t || 0, thisWeek: weekRev[0]?.t || 0, thisMonth: monthRev[0]?.t || 0, total: totalRev[0]?.t || 0 },
        products: { active: totalProducts, lowStock: lowStockProducts.map(p => `${p.name} (${p.stock} left)`) },
        customers: { total: totalCustomers },
        activeCoupons,
        recentOrders: recentOrders.map(o => ({
            id: o.orderId, status: o.orderStatus, amount: o.totalAmt,
            date: new Date(o.createdAt).toLocaleDateString('en-IN'),
            customer: o.delivery_address_snapshot?.name || 'N/A',
            payment: o.payment_status,
        })),
        topProducts: topProducts.map(p => ({ name: p._id, orders: p.orders })),
    }
}

async function executeAction(action) {
    try {
        switch (action.type) {
            case 'cancel_order': {
                const order = await OrderModel.findOneAndUpdate(
                    { $or: [{ orderId: action.orderId }, { _id: action.orderId }] },
                    { orderStatus: 'Cancelled' }, { new: true }
                )
                if (!order) return { success: false, message: `Order "${action.orderId}" not found.` }
                return { success: true, message: `Order #${order.orderId} has been cancelled.` }
            }
            case 'update_order_status': {
                const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
                if (!validStatuses.includes(action.status)) return { success: false, message: `Invalid status "${action.status}".` }
                const order = await OrderModel.findOneAndUpdate(
                    { $or: [{ orderId: action.orderId }, { _id: action.orderId }] },
                    { orderStatus: action.status }, { new: true }
                )
                if (!order) return { success: false, message: `Order "${action.orderId}" not found.` }
                return { success: true, message: `Order #${order.orderId} status → ${action.status}.` }
            }
            case 'find_order': {
                const order = await OrderModel.findOne(
                    { $or: [{ orderId: action.orderId }, { _id: action.orderId }] }
                ).select('orderId orderStatus totalAmt createdAt payment_status delivery_address_snapshot items')
                if (!order) return { success: false, message: `Order "${action.orderId}" not found.` }
                return {
                    success: true,
                    data: {
                        id: order.orderId, status: order.orderStatus,
                        amount: order.totalAmt, payment: order.payment_status,
                        customer: order.delivery_address_snapshot?.name,
                        date: new Date(order.createdAt).toLocaleDateString('en-IN'),
                        items: order.items.map(i => `${i.product_details?.name} x${i.quantity}`).join(', '),
                    }
                }
            }
            case 'create_coupon': {
                const existing = await CouponModel.findOne({ code: action.code.toUpperCase() })
                if (existing) return { success: false, message: `Coupon "${action.code}" already exists.` }
                const coupon = await CouponModel.create({
                    code:            action.code.toUpperCase(),
                    discountType:    action.discountType  || 'percentage',
                    discountValue:   Number(action.discountValue) || 10,
                    minOrderAmount:  Number(action.minOrderAmount) || 0,
                    maxUses:         Number(action.maxUses) || 100,
                    isActive:        true,
                })
                return { success: true, message: `Coupon **${coupon.code}** created! ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '₹' + coupon.discountValue} off, min order ₹${coupon.minOrderAmount}.` }
            }
            case 'toggle_product': {
                const product = await ProductModel.findOne({
                    $or: [{ _id: action.productId }, { name: { $regex: action.productName, $options: 'i' } }]
                })
                if (!product) return { success: false, message: 'Product not found.' }
                product.publish = action.publish !== undefined ? action.publish : !product.publish
                await product.save()
                return { success: true, message: `Product "${product.name}" is now ${product.publish ? 'published' : 'unpublished'}.` }
            }
            default:
                return { success: false, message: 'Unknown action type.' }
        }
    } catch (err) {
        return { success: false, message: err.message }
    }
}

export async function aiAgentChat(req, res) {
    try {
        const { message, history = [] } = req.body
        if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' })

        const ctx = await gatherStoreContext()

        const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

        const systemPrompt = `You are Aria, a smart AI admin assistant for a premium saree e-commerce store. You help the admin manage orders, analytics, inventory, and coupons.

Current Store Snapshot (${istTime} IST):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDERS
• Today: ${ctx.orders.today} | This week: ${ctx.orders.thisWeek} | This month: ${ctx.orders.thisMonth} | Total: ${ctx.orders.total}
• Pending: ${ctx.orders.pending} | Confirmed: ${ctx.orders.confirmed} | Shipped: ${ctx.orders.shipped}

REVENUE (Online paid orders only)
• Today: ₹${ctx.revenue.today.toLocaleString('en-IN')} | This week: ₹${ctx.revenue.thisWeek.toLocaleString('en-IN')}
• This month: ₹${ctx.revenue.thisMonth.toLocaleString('en-IN')} | All time: ₹${ctx.revenue.total.toLocaleString('en-IN')}

PRODUCTS & CUSTOMERS
• Active products: ${ctx.products.active} | Total customers: ${ctx.customers.total} | Active coupons: ${ctx.activeCoupons}
• Low stock (< 5 units): ${ctx.products.lowStock.length ? ctx.products.lowStock.join(', ') : 'None'}

TOP SELLING PRODUCTS
${ctx.topProducts.map((p, i) => `${i + 1}. ${p.name} — ${p.orders} orders`).join('\n')}

RECENT ORDERS
${ctx.recentOrders.map(o => `• #${o.id} | ${o.customer} | ₹${o.amount} | ${o.status} | ${o.date}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT — If the admin asks you to perform an action, include a JSON action block at the END of your response like this:
<<<ACTION>>>
{"type": "action_type", "param": "value"}
<<<END>>>

Available actions:
• cancel_order:         {"type":"cancel_order","orderId":"ORD-123"}
• update_order_status:  {"type":"update_order_status","orderId":"ORD-123","status":"Confirmed"}  (statuses: Pending/Confirmed/Shipped/Out for Delivery/Delivered/Cancelled)
• find_order:           {"type":"find_order","orderId":"ORD-123"}
• create_coupon:        {"type":"create_coupon","code":"SAVE20","discountType":"percentage","discountValue":20,"minOrderAmount":500,"maxUses":100}
• toggle_product:       {"type":"toggle_product","productName":"Silk Saree","publish":false}

Rules:
- Be concise and friendly. Use bullet points and emojis for readability.
- Format all prices in Indian Rupee style (₹1,000).
- If you don't know something, say so — don't make up data.
- Only include an ACTION block if a real action should be executed. Do NOT include it for read-only questions.
- After executing an action, confirm what was done.
- Respond in the same language the admin uses.`

        // Build history for Gemini — exclude the last entry (current user message,
        // already being sent via sendMessage) and drop any leading 'model' turns
        // because Gemini requires history to always start with a 'user' turn.
        let chatHistory = history.slice(0, -1).slice(-12).map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
        }))
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory.shift()
        }

        const chatModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
        })

        const chat = chatModel.startChat({
            history: chatHistory,
        })

        const result = await chat.sendMessage(message)
        let responseText = result.response.text()

        let actionResult = null
        const actionMatch = responseText.match(/<<<ACTION>>>([\s\S]*?)<<<END>>>/)
        if (actionMatch) {
            try {
                const actionJson = JSON.parse(actionMatch[1].trim())
                actionResult = await executeAction(actionJson)
                responseText = responseText.replace(/<<<ACTION>>>([\s\S]*?)<<<END>>>/, '').trim()
                if (actionResult?.message) {
                    responseText += `\n\n✅ **${actionResult.message}**`
                }
            } catch (e) {
                console.error('[AI] Action parse error:', e.message)
            }
        }

        return res.json({ success: true, response: responseText, action: actionResult })
    } catch (error) {
        console.error('[AI Agent] Error:', error.message)
        return res.status(500).json({ success: false, message: 'AI agent error. Check your API key.' })
    }
}
