import mongoose from "mongoose"

/**
 * Persisted lookup for popup-coupon and popup-address data sent by Razorpay
 * Magic Checkout during a user's checkout session.
 *
 * These values arrive on one serverless lambda (apply-promotion /
 * shipping-info) and must be read by a DIFFERENT lambda (razorpay-verify /
 * cash-on-delivery). An in-process Map does NOT survive cross-instance hops on
 * Vercel/Netlify/AWS Lambda — so we persist with a TTL index that auto-expires
 * documents 30 minutes after they were written.
 */
const popupCheckoutSchema = new mongoose.Schema({
    key:       { type: String, required: true, index: true },
    kind:      { type: String, enum: ['coupon', 'address'], required: true },
    data:      { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
})
// Auto-delete docs whose expiresAt has passed
popupCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
popupCheckoutSchema.index({ key: 1, kind: 1 }, { unique: true })

const PopupCheckoutModel = mongoose.models.popupCheckout || mongoose.model('popupCheckout', popupCheckoutSchema)

export default PopupCheckoutModel
