import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.RESEND_API) {
    console.log("Provide RESEND_API inside the .env file")
}

let resendClient = null
const getResend = () => {
    if (!resendClient) {
        if (!process.env.RESEND_API) return null
        resendClient = new Resend(process.env.RESEND_API)
    }
    return resendClient
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME  = process.env.STORE_NAME || 'Sarees Store'

const sendEmail = async ({ sendTo, subject, html }) => {
    try {
        const resend = getResend()
        if (!resend) {
            console.log('sendEmail: RESEND_API not configured, skipping email')
            return null
        }
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: sendTo,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend email error:', JSON.stringify(error))
            return null
        }

        console.log(`Email sent to ${sendTo} — id: ${data?.id}`)
        return data
    } catch (error) {
        console.log('sendEmail exception:', error?.message || error)
        return null
    }
}

export default sendEmail
