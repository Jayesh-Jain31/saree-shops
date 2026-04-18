import { sendOtpFast2SMS } from '../utils/fast2sms.js'

const otpStore = new Map()

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const cleanMobile = (mobile) => String(mobile).replace(/^91/, '').replace(/\D/g, '')

export const sendCodOtp = async (req, res) => {
    try {
        const { mobile } = req.body
        if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' })

        const key = cleanMobile(mobile)
        const otp = generateOtp()
        otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 })

        const result = await sendOtpFast2SMS(mobile, otp)

        if (result.return === true) {
            return res.json({ success: true, message: 'OTP sent to your mobile number' })
        }
        return res.status(400).json({ success: false, message: result.message?.[0] || 'Failed to send OTP' })
    } catch (err) {
        console.error('[OTP] sendCodOtp error:', err?.response?.data || err.message)
        const msg = err?.response?.data?.message?.[0] || err.message || 'Error sending OTP'
        return res.status(500).json({ success: false, message: msg })
    }
}

export const verifyCodOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body
        if (!mobile || !otp) return res.status(400).json({ success: false, message: 'Mobile and OTP are required' })

        const key = cleanMobile(mobile)
        const record = otpStore.get(key)

        if (!record) return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' })
        if (Date.now() > record.expiresAt) {
            otpStore.delete(key)
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' })
        }
        if (record.otp !== String(otp)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' })
        }

        otpStore.delete(key)
        return res.json({ success: true, message: 'OTP verified successfully' })
    } catch (err) {
        console.error('[OTP] verifyCodOtp error:', err.message)
        return res.status(500).json({ success: false, message: 'Error verifying OTP' })
    }
}

export const resendCodOtp = async (req, res) => {
    try {
        const { mobile } = req.body
        if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' })

        const key = cleanMobile(mobile)
        const otp = generateOtp()
        otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 })

        const result = await sendOtpFast2SMS(mobile, otp)

        if (result.return === true) {
            return res.json({ success: true, message: 'OTP resent successfully' })
        }
        return res.status(400).json({ success: false, message: result.message?.[0] || 'Failed to resend OTP' })
    } catch (err) {
        console.error('[OTP] resendCodOtp error:', err?.response?.data || err.message)
        const msg = err?.response?.data?.message?.[0] || err.message || 'Error resending OTP'
        return res.status(500).json({ success: false, message: msg })
    }
}
