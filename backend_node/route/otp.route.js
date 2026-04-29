import { Router } from 'express'
import auth from '../middleware/auth.js'
import { sendCodOtp, verifyCodOtp, resendCodOtp } from '../controllers/otp.controller.js'

const otpRouter = Router()

otpRouter.post('/send', auth, sendCodOtp)
otpRouter.post('/verify', auth, verifyCodOtp)
otpRouter.post('/resend', auth, resendCodOtp)

export default otpRouter
