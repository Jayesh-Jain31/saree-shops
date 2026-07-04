import Razorpay from 'razorpay'
import dotenv from 'dotenv'
dotenv.config()

let razorpayClient = null

const getRazorpay = () => {
    if (!razorpayClient) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return null
        }
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
    }
    return razorpayClient
}

// Proxy so existing code `Razorpay.orders.create(...)` works unchanged.
// If keys are missing, methods will throw a clear error at call-time, not at import.
const razorpayProxy = new Proxy({}, {
    get(_, prop) {
        const instance = getRazorpay()
        if (!instance) {
            // Return an object whose methods all throw a helpful error
            return new Proxy({}, {
                get(__, method) {
                    return async () => {
                        throw new Error(`Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets.`)
                    }
                }
            })
        }
        const val = instance[prop]
        return typeof val === 'function' ? val.bind(instance) : val
    }
})

export default razorpayProxy
