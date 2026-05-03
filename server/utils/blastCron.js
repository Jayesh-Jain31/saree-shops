import ScheduledBlastModel from '../models/scheduledBlast.model.js'
import UserModel from '../models/user.model.js'
import CouponModel from '../models/coupon.model.js'
import { sendFreeTextWhatsApp } from './whatsapp.js'

const runBlasts = async () => {
    try {
        const now = new Date()
        const duePending = await ScheduledBlastModel.find({
            status: 'pending',
            scheduledAt: { $lte: now }
        })

        if (!duePending.length) return

        for (const blast of duePending) {
            await ScheduledBlastModel.updateOne({ _id: blast._id }, { status: 'sending' })
            console.log(`[BlastCron] Starting blast "${blast.couponCode}" scheduled for ${blast.scheduledAt}`)

            try {
                const coupon = await CouponModel.findOne({ code: blast.couponCode, isActive: true })
                if (!coupon) {
                    await ScheduledBlastModel.updateOne({ _id: blast._id }, { status: 'failed', sentAt: new Date() })
                    console.warn(`[BlastCron] Coupon "${blast.couponCode}" not found/inactive — blast failed`)
                    continue
                }

                const users = await UserModel.find({ mobile: { $ne: null }, status: 'Active' }).select('mobile name').lean()
                let sent = 0, failed = 0

                for (const user of users) {
                    try {
                        const personalised = blast.message
                            .replace(/{{name}}/gi, user.name || 'Customer')
                            .replace(/{{code}}/gi, coupon.code)
                        await sendFreeTextWhatsApp(user.mobile, personalised)
                        sent++
                        await new Promise(r => setTimeout(r, 120))
                    } catch { failed++ }
                }

                await ScheduledBlastModel.updateOne({ _id: blast._id }, {
                    status: 'sent',
                    sentAt: new Date(),
                    sentCount: sent,
                    failedCount: failed
                })
                console.log(`[BlastCron] ✓ Blast "${blast.couponCode}" done — sent: ${sent}, failed: ${failed}`)
            } catch (err) {
                await ScheduledBlastModel.updateOne({ _id: blast._id }, { status: 'failed', sentAt: new Date() })
                console.error(`[BlastCron] Blast "${blast.couponCode}" error:`, err.message)
            }
        }
    } catch (err) {
        console.error('[BlastCron] Error:', err.message)
    }
}

export const startBlastCron = () => {
    setTimeout(() => runBlasts().catch(() => {}), 5000)
    setInterval(() => runBlasts().catch(() => {}), 60 * 1000)
    console.log('[BlastCron] Started — checks every minute')
}
