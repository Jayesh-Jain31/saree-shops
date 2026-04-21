import LoyaltyModel from '../models/loyalty.model.js'
import SettingModel from '../models/settings.model.js'

const getLoyaltySettings = async () => {
    const keys = ['loyalty_earn_per_100', 'loyalty_point_value', 'loyalty_min_redeem', 'loyalty_max_redeem_pct']
    const settings = await SettingModel.find({ key: { $in: keys } })
    const map = {}
    settings.forEach(s => { map[s.key] = parseFloat(s.value) || 0 })
    return {
        earnPer100: map['loyalty_earn_per_100'] ?? 10,
        pointValue: map['loyalty_point_value'] ?? 0.25,
        minRedeem: map['loyalty_min_redeem'] ?? 50,
        maxRedeemPct: map['loyalty_max_redeem_pct'] ?? 50,
    }
}

export const getMyLoyalty = async (req, res) => {
    try {
        const userId = req.userId
        let loyalty = await LoyaltyModel.findOne({ userId })
        if (!loyalty) loyalty = { points: 0, totalEarned: 0, totalRedeemed: 0, transactions: [] }
        const settings = await getLoyaltySettings()
        return res.json({
            data: {
                points: loyalty.points || 0,
                totalEarned: loyalty.totalEarned || 0,
                totalRedeemed: loyalty.totalRedeemed || 0,
                transactions: (loyalty.transactions || []).slice(0, 50),
                settings,
                rupeeValue: parseFloat(((loyalty.points || 0) * settings.pointValue).toFixed(2))
            },
            error: false, success: true
        })
    } catch (e) {
        return res.status(500).json({ message: e.message, error: true, success: false })
    }
}

export const redeemPreview = async (req, res) => {
    try {
        const userId = req.userId
        const { orderAmount, pointsToRedeem } = req.body
        const settings = await getLoyaltySettings()
        const loyalty = await LoyaltyModel.findOne({ userId })
        const availablePoints = loyalty?.points || 0

        if (availablePoints < settings.minRedeem) {
            return res.json({ eligible: false, message: `Minimum ${settings.minRedeem} points required to redeem`, data: null, error: false, success: true })
        }

        const maxByPct = Math.floor((orderAmount * settings.maxRedeemPct) / 100 / settings.pointValue)
        const maxRedeemable = Math.min(availablePoints, maxByPct)
        const toRedeem = pointsToRedeem ? Math.min(pointsToRedeem, maxRedeemable) : maxRedeemable
        const discount = parseFloat((toRedeem * settings.pointValue).toFixed(2))

        return res.json({
            eligible: true,
            data: { availablePoints, toRedeem, discount, maxRedeemable, pointValue: settings.pointValue },
            error: false, success: true
        })
    } catch (e) {
        return res.status(500).json({ message: e.message, error: true, success: false })
    }
}

export const earnPointsInternal = async (userId, orderAmount, orderId) => {
    try {
        const settings = await getLoyaltySettings()
        const pointsEarned = Math.floor((orderAmount / 100) * settings.earnPer100)
        if (pointsEarned <= 0) return 0

        let loyalty = await LoyaltyModel.findOne({ userId })
        if (!loyalty) loyalty = await LoyaltyModel.create({ userId, points: 0, totalEarned: 0, totalRedeemed: 0, transactions: [] })

        loyalty.points += pointsEarned
        loyalty.totalEarned += pointsEarned
        loyalty.transactions.unshift({
            type: 'earned',
            points: pointsEarned,
            description: `Earned for order ${orderId}`,
            reference: orderId,
            balanceAfter: loyalty.points
        })
        await loyalty.save()
        console.log(`[Loyalty] +${pointsEarned} pts for user ${userId}, order ${orderId}`)
        return pointsEarned
    } catch (e) {
        console.error('[Loyalty] Earn failed:', e.message)
        return 0
    }
}

export const redeemPointsInternal = async (userId, pointsToRedeem, orderId) => {
    try {
        const settings = await getLoyaltySettings()
        const loyalty = await LoyaltyModel.findOne({ userId })
        if (!loyalty || loyalty.points < pointsToRedeem) return 0

        const discount = parseFloat((pointsToRedeem * settings.pointValue).toFixed(2))
        loyalty.points -= pointsToRedeem
        loyalty.totalRedeemed += pointsToRedeem
        loyalty.transactions.unshift({
            type: 'redeemed',
            points: -pointsToRedeem,
            description: `Redeemed for order ${orderId}`,
            reference: orderId,
            balanceAfter: loyalty.points
        })
        await loyalty.save()
        console.log(`[Loyalty] -${pointsToRedeem} pts redeemed for user ${userId}, discount ₹${discount}`)
        return discount
    } catch (e) {
        console.error('[Loyalty] Redeem failed:', e.message)
        return 0
    }
}

export const deductPointsInternal = async (userId, points, reason, reference) => {
    try {
        const loyalty = await LoyaltyModel.findOne({ userId })
        if (!loyalty || loyalty.points <= 0) return
        const deduct = Math.min(loyalty.points, points)
        loyalty.points -= deduct
        loyalty.transactions.unshift({
            type: 'deducted',
            points: -deduct,
            description: reason || 'Points deducted',
            reference: reference || '',
            balanceAfter: loyalty.points
        })
        await loyalty.save()
        console.log(`[Loyalty] -${deduct} pts deducted for user ${userId}: ${reason}`)
    } catch (e) {
        console.error('[Loyalty] Deduct failed:', e.message)
    }
}

export const getAllLoyalty = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [loyalties, total] = await Promise.all([
            LoyaltyModel.find({}).populate('userId', 'name email mobile').sort({ points: -1 }).skip(skip).limit(parseInt(limit)),
            LoyaltyModel.countDocuments()
        ])
        return res.json({ data: loyalties, total, page: parseInt(page), error: false, success: true })
    } catch (e) {
        return res.status(500).json({ message: e.message, error: true, success: false })
    }
}

export const adminAdjustPoints = async (req, res) => {
    try {
        const { userId, points, reason } = req.body
        if (!userId || !points || !reason) return res.status(400).json({ message: 'userId, points and reason required', error: true, success: false })

        let loyalty = await LoyaltyModel.findOne({ userId })
        if (!loyalty) loyalty = await LoyaltyModel.create({ userId, points: 0, totalEarned: 0, totalRedeemed: 0, transactions: [] })

        const type = points > 0 ? 'bonus' : 'deducted'
        loyalty.points = Math.max(0, loyalty.points + points)
        if (points > 0) loyalty.totalEarned += points
        loyalty.transactions.unshift({
            type,
            points,
            description: reason,
            reference: 'admin',
            balanceAfter: loyalty.points
        })
        await loyalty.save()
        return res.json({ message: `Points adjusted by ${points}`, data: loyalty, error: false, success: true })
    } catch (e) {
        return res.status(500).json({ message: e.message, error: true, success: false })
    }
}
