import axios from 'axios'

const AUTH_KEY = process.env.MSG91_AUTH_KEY
const TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID

const cleanMobile = (mobile) => `91${String(mobile).replace(/^91/, '').replace(/\D/g, '')}`

export const sendOtpMsg91 = async (mobile) => {
    const fullMobile = cleanMobile(mobile)
    console.log('[MSG91] Sending OTP to:', fullMobile, '| Template:', TEMPLATE_ID, '| AuthKey set:', !!AUTH_KEY)
    const response = await axios.post(
        `https://control.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=${fullMobile}&otp_length=6&otp_expiry=5`,
        {},
        {
            headers: {
                authkey: AUTH_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    console.log('[MSG91] Send OTP response:', JSON.stringify(response.data))
    return response.data
}

export const verifyOtpMsg91 = async (mobile, otp) => {
    const fullMobile = cleanMobile(mobile)
    console.log('[MSG91] Verifying OTP for:', fullMobile, '| OTP:', otp)
    const response = await axios.post(
        `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${fullMobile}`,
        {},
        {
            headers: {
                authkey: AUTH_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    console.log('[MSG91] Verify OTP response:', JSON.stringify(response.data))
    return response.data
}

export const resendOtpMsg91 = async (mobile) => {
    const fullMobile = cleanMobile(mobile)
    console.log('[MSG91] Resending OTP to:', fullMobile)
    const response = await axios.get(
        `https://control.msg91.com/api/v5/otp/retry?mobile=${fullMobile}&retrytype=text`,
        {
            headers: { authkey: AUTH_KEY }
        }
    )
    console.log('[MSG91] Resend OTP response:', JSON.stringify(response.data))
    return response.data
}
