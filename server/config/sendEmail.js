import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.RESEND_API) {
    console.log("Provide RESEND_API inside the .env file")
}

const resend = new Resend(process.env.RESEND_API);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME  = process.env.STORE_NAME || 'Sarees Store'

const sendEmail = async ({ sendTo, subject, html }) => {
    try {
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
