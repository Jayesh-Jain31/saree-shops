import axios from 'axios'

const API_KEY = process.env.FAST2SMS_API_KEY

export const sendOtpFast2SMS = async (mobile, otp) => {
    const cleanMobile = String(mobile).replace(/^91/, '').replace(/\D/g, '')
    console.log('[Fast2SMS] Sending OTP to:', cleanMobile)
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
            authorization: API_KEY,
            route: 'q',
            message: `Your OTP for order verification is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
            language: 'english',
            flash: 0,
            numbers: cleanMobile
        },
        headers: { 'cache-control': 'no-cache' }
    })
    console.log('[Fast2SMS] Response:', JSON.stringify(response.data))
    return response.data
}
