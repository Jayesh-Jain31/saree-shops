import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { getSettingsController, updateSettingController } from '../controllers/settings.controller.js'
import { sendOrderConfirmationWhatsApp, sendCODVerificationWhatsApp, testWhatsAppConnection } from '../utils/whatsapp.js'

const settingsRouter = Router()

settingsRouter.get('/get', getSettingsController)
settingsRouter.put('/update', auth, admin, updateSettingController)

settingsRouter.post('/whatsapp-test-connection', auth, admin, async (req, res) => {
    try {
        const result = await testWhatsAppConnection()
        if (!result.ok) return res.status(400).json({ message: result.error, error: true, success: false })
        return res.json({
            message: `Connected! Number: ${result.displayPhoneNumber || 'N/A'} | Name: ${result.verifiedName || 'N/A'}`,
            error: false, success: true
        })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

settingsRouter.post('/test-whatsapp', auth, admin, async (req, res) => {
    try {
        const { mobile, template = 'order_confirmation' } = req.body
        if (!mobile) return res.status(400).json({ message: 'mobile is required', error: true, success: false })

        if (template === 'order_confirmation') {
            await sendOrderConfirmationWhatsApp({
                mobile,
                name: 'Test Customer',
                orderId: 'ORD-TEST-001',
                totalAmt: 999,
                paymentMethod: 'PAID'
            })
        } else if (template === 'cod_verification') {
            await sendCODVerificationWhatsApp({
                mobile,
                name: 'Test Customer',
                orderId: 'ORD-TEST-001',
                totalAmt: 999
            })
        }

        return res.json({ message: `Test WhatsApp sent via '${template}' template to ${mobile}.`, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message, error: true, success: false })
    }
})

export default settingsRouter
