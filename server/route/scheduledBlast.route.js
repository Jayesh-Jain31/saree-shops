import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import ScheduledBlastModel from '../models/scheduledBlast.model.js'
import CouponModel from '../models/coupon.model.js'

const blastRouter = Router()

blastRouter.post('/schedule', auth, admin, async (req, res) => {
    try {
        const { couponCode, message, scheduledAt, note } = req.body
        if (!couponCode?.trim()) return res.status(400).json({ message: 'Coupon code required', error: true, success: false })
        if (!message?.trim()) return res.status(400).json({ message: 'Message required', error: true, success: false })
        if (!scheduledAt) return res.status(400).json({ message: 'Schedule date/time required', error: true, success: false })

        const schedDate = new Date(scheduledAt)
        if (isNaN(schedDate.getTime())) return res.status(400).json({ message: 'Invalid date/time', error: true, success: false })
        if (schedDate <= new Date()) return res.status(400).json({ message: 'Schedule time must be in the future', error: true, success: false })

        const coupon = await CouponModel.findOne({ code: couponCode.trim().toUpperCase(), isActive: true })
        if (!coupon) return res.status(404).json({ message: `Coupon "${couponCode}" not found or inactive`, error: true, success: false })

        const blast = await ScheduledBlastModel.create({
            couponCode: coupon.code,
            message: message.trim(),
            scheduledAt: schedDate,
            note: note?.trim() || '',
            createdBy: req.userId
        })

        return res.json({ message: `Blast scheduled for ${schedDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, data: blast, success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

blastRouter.get('/list', auth, admin, async (req, res) => {
    try {
        const blasts = await ScheduledBlastModel.find({}).sort({ scheduledAt: -1 }).limit(30).lean()
        return res.json({ data: blasts, success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

blastRouter.put('/cancel/:id', auth, admin, async (req, res) => {
    try {
        const blast = await ScheduledBlastModel.findOne({ _id: req.params.id, status: 'pending' })
        if (!blast) return res.status(404).json({ message: 'Scheduled blast not found or already sent', error: true, success: false })
        await ScheduledBlastModel.updateOne({ _id: blast._id }, { status: 'cancelled' })
        return res.json({ message: 'Blast cancelled', success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

blastRouter.delete('/:id', auth, admin, async (req, res) => {
    try {
        await ScheduledBlastModel.deleteOne({ _id: req.params.id })
        return res.json({ message: 'Deleted', success: true, error: false })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

export default blastRouter
