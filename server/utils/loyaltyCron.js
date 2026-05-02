import OrderModel from '../models/order.model.js'
import SettingModel from '../models/settings.model.js'
import WalletModel from '../models/wallet.model.js'
import LoyaltyModel from '../models/loyalty.model.js'

const getReturnPeriodDays = async () => {
    try {
        const setting = await SettingModel.findOne({ key: 'loyalty_return_period_days' }).lean()
        return parseInt(setting?.value) || 7
    } catch { return 7 }
}

const getLoyaltySettings = async () => {
    const keys = ['loyalty_point_value']
    const settings = await SettingModel.find({ key: { $in: keys } })
    const map = {}
    settings.forEach(s => { map[s.key] = parseFloat(s.value) || 0 })
    return { pointValue: map['loyalty_point_value'] ?? 0.25 }
}

export const processLoyaltyRewards = async () => {
    try {
        const returnPeriodDays = await getReturnPeriodDays()
        const deliveredCutoff = new Date(Date.now() - returnPeriodDays * 24 * 60 * 60 * 1000)
        const oldOrderCutoff  = new Date(Date.now() - (returnPeriodDays + 15) * 24 * 60 * 60 * 1000)

        const eligibleOrders = await OrderModel.find({
            loyaltyPointsPending: { $gt: 0 },
            loyaltyPointsProcessed: { $ne: true },
            $or: [
                { orderStatus: 'Delivered', deliveredAt: { $ne: null, $lte: deliveredCutoff } },
                {
                    orderStatus: { $in: ['Confirmed', 'Shipped', 'Out for Delivery'] },
                    createdAt:   { $lte: oldOrderCutoff }
                }
            ]
        }).lean()

        if (eligibleOrders.length === 0) return

        console.log(`[LoyaltyCron] Processing ${eligibleOrders.length} order(s)`)
        const loySettings = await getLoyaltySettings()

        for (const order of eligibleOrders) {
            try {
                const rupeeValue = parseFloat((order.loyaltyPointsPending * loySettings.pointValue).toFixed(2))
                if (rupeeValue <= 0) {
                    await OrderModel.updateOne({ _id: order._id }, { $set: { loyaltyPointsProcessed: true } })
                    continue
                }

                let wallet = await WalletModel.findOne({ userId: order.userId })
                if (!wallet) wallet = await WalletModel.create({ userId: order.userId, balance: 0, transactions: [] })

                wallet.balance = parseFloat((wallet.balance + rupeeValue).toFixed(2))
                wallet.transactions.unshift({
                    type: 'credit',
                    amount: rupeeValue,
                    description: `Loyalty reward — ${order.loyaltyPointsPending} pts for order ${order.orderId}`,
                    reference: order.orderId,
                    balanceAfter: wallet.balance
                })
                await wallet.save()

                await OrderModel.updateOne({ _id: order._id }, { $set: { loyaltyPointsProcessed: true } })
                console.log(`[LoyaltyCron] ✓ ₹${rupeeValue} → wallet for order ${order.orderId}`)
            } catch (e) {
                console.error(`[LoyaltyCron] Failed for order ${order.orderId}:`, e.message)
            }
        }
    } catch (e) {
        console.error('[LoyaltyCron] Error:', e.message)
    }
}

export const startLoyaltyCron = () => {
    setTimeout(() => processLoyaltyRewards().catch(() => {}), 10000)
    setInterval(() => processLoyaltyRewards().catch(() => {}), 6 * 60 * 60 * 1000)
    console.log('[LoyaltyCron] Started — checks every 6 hours')
}
