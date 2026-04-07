import FraudFlagModel from '../models/fraudFlag.model.js'
import OrderModel from '../models/order.model.js'
import UserModel from '../models/user.model.js'
import { assessUserRisk } from '../utils/fraudDetection.js'

export const getFraudFlags = async (req, res) => {
    try {
        const { type, status = 'all', riskLevel, page = 1, limit = 50 } = req.query
        const filter = {}
        if (type && type !== 'all') filter.type = type
        if (status && status !== 'all') filter.status = status
        if (riskLevel && riskLevel !== 'all') filter.riskLevel = riskLevel

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const [flags, total] = await Promise.all([
            FraudFlagModel.find(filter)
                .populate('userId', 'name email mobile role createdAt')
                .populate('orderId', 'orderId totalAmt payment_status orderStatus createdAt')
                .sort({ riskScore: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            FraudFlagModel.countDocuments(filter)
        ])

        return res.json({ data: flags, total, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

export const getFraudStats = async (req, res) => {
    try {
        const [total, flagged, blocked, cleared, critical, high, medium, orderFlags, userFlags] = await Promise.all([
            FraudFlagModel.countDocuments(),
            FraudFlagModel.countDocuments({ status: 'flagged' }),
            FraudFlagModel.countDocuments({ status: 'blocked' }),
            FraudFlagModel.countDocuments({ status: 'cleared' }),
            FraudFlagModel.countDocuments({ riskLevel: 'critical' }),
            FraudFlagModel.countDocuments({ riskLevel: 'high' }),
            FraudFlagModel.countDocuments({ riskLevel: 'medium' }),
            FraudFlagModel.countDocuments({ type: 'order' }),
            FraudFlagModel.countDocuments({ type: 'user' }),
        ])

        return res.json({
            data: { total, flagged, blocked, cleared, critical, high, medium, orderFlags, userFlags },
            error: false, success: true
        })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

export const updateFraudFlag = async (req, res) => {
    try {
        const { id } = req.params
        const { status, reviewNote } = req.body
        const adminId = req.userId

        const flag = await FraudFlagModel.findById(id)
        if (!flag) return res.status(404).json({ message: 'Flag not found', error: true, success: false })

        flag.status = status
        flag.reviewNote = reviewNote || ''
        flag.reviewedBy = adminId
        flag.reviewedAt = new Date()
        await flag.save()

        // If blocking a user, update their role/status
        if (status === 'blocked' && flag.type === 'user') {
            await UserModel.findByIdAndUpdate(flag.userId, { isFraudBlocked: true })
        }
        if (status === 'cleared' && flag.type === 'user') {
            await UserModel.findByIdAndUpdate(flag.userId, { isFraudBlocked: false })
        }

        return res.json({ data: flag, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

export const runUserFraudScan = async (req, res) => {
    try {
        const users = await UserModel.find({ role: { $ne: 'ADMIN' } }).limit(200)
        let flaggedCount = 0

        for (const user of users) {
            const { riskScore, riskLevel, reasons } = await assessUserRisk(user._id)
            if (riskScore >= 30) {
                const existing = await FraudFlagModel.findOne({ userId: user._id, type: 'user' })
                if (!existing) {
                    await FraudFlagModel.create({
                        type: 'user',
                        userId: user._id,
                        riskScore,
                        riskLevel,
                        reasons,
                        snapshot: { name: user.name, email: user.email, mobile: user.mobile }
                    })
                    flaggedCount++
                } else if (existing.status === 'flagged') {
                    existing.riskScore = riskScore
                    existing.riskLevel = riskLevel
                    existing.reasons = reasons
                    await existing.save()
                }
            }
        }

        return res.json({ message: `Scan complete. ${flaggedCount} new user(s) flagged.`, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}

export const deleteFraudFlag = async (req, res) => {
    try {
        const { id } = req.params
        await FraudFlagModel.findByIdAndDelete(id)
        return res.json({ message: 'Flag removed', error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
}
