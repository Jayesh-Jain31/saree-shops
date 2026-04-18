import { sendOtpMsg91, verifyOtpMsg91, resendOtpMsg91 } from '../utils/msg91.js'

export const sendCodOtp = async (req, res) => {
    try {
        const { mobile } = req.body
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' })
        }
        const result = await sendOtpMsg91(mobile)
        if (result.type === 'success') {
            return res.json({ success: true, message: 'OTP sent to your mobile number' })
        }
        return res.status(400).json({ success: false, message: result.message || 'Failed to send OTP' })
    } catch (err) {
        console.error('[OTP] sendCodOtp error:', err?.response?.data || err.message)
        const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || err.message || 'Error sending OTP'
        return res.status(500).json({ success: false, message: msg })
    }
}

export const verifyCodOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body
        if (!mobile || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile and OTP are required' })
        }
        const result = await verifyOtpMsg91(mobile, otp)
        if (result.type === 'success') {
            return res.json({ success: true, message: 'OTP verified successfully' })
        }
        return res.status(400).json({ success: false, message: result.message || 'Invalid or expired OTP' })
    } catch (err) {
        console.error('[OTP] verifyCodOtp error:', err?.response?.data || err.message)
        const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || err.message || 'Error verifying OTP'
        return res.status(500).json({ success: false, message: msg })
    }
}

export const resendCodOtp = async (req, res) => {
    try {
        const { mobile } = req.body
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' })
        }
        const result = await resendOtpMsg91(mobile)
        if (result.type === 'success') {
            return res.json({ success: true, message: 'OTP resent successfully' })
        }
        return res.status(400).json({ success: false, message: result.message || 'Failed to resend OTP' })
    } catch (err) {
        console.error('[OTP] resendCodOtp error:', err?.response?.data || err.message)
        const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || err.message || 'Error resending OTP'
        return res.status(500).json({ success: false, message: msg })
    }
}
