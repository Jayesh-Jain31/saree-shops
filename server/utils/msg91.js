import axios from 'axios'

const AUTH_KEY = process.env.MSG91_AUTH_KEY
const TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID

export const sendOtpMsg91 = async (mobile) => {
    const fullMobile = `91${String(mobile).replace(/^91/, '')}`
    const response = await axios.post(
        'https://control.msg91.com/api/v5/otp',
        {
            template_id: TEMPLATE_ID,
            mobile: fullMobile,
            otp_length: 6,
            otp_expiry: 5
        },
        {
            headers: {
                authkey: AUTH_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data
}

export const verifyOtpMsg91 = async (mobile, otp) => {
    const fullMobile = `91${String(mobile).replace(/^91/, '')}`
    const response = await axios.post(
        'https://control.msg91.com/api/v5/otp/verify',
        {
            otp: String(otp),
            mobile: fullMobile
        },
        {
            headers: {
                authkey: AUTH_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data
}

export const resendOtpMsg91 = async (mobile) => {
    const fullMobile = `91${String(mobile).replace(/^91/, '')}`
    const response = await axios.get(
        `https://control.msg91.com/api/v5/otp/retry?mobile=${fullMobile}&retrytype=text`,
        {
            headers: { authkey: AUTH_KEY }
        }
    )
    return response.data
}
