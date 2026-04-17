const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

const formatPhone = (mobile) => {
    if (!mobile) return null
    const cleaned = String(mobile).replace(/\D/g, '')
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned
    if (cleaned.length === 10) return `91${cleaned}`
    if (cleaned.length > 10) return cleaned
    return null
}

const sendWhatsApp = async (to, payload) => {
    if (!ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return
    const phone = formatPhone(to)
    if (!phone) return

    try {
        const res = await fetch(WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, ...payload })
        })
        const data = await res.json()
        if (!res.ok) {
            if (process.env.NODE_ENV !== 'production') console.log('WhatsApp error:', JSON.stringify(data))
        }
        return data
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.log('WhatsApp send failed:', err.message)
    }
}

const textParam = (text) => ({ type: 'text', text: String(text) })

const sendTemplate = (to, templateName, langCode = 'en', bodyParams = []) => {
    return sendWhatsApp(to, {
        type: 'template',
        template: {
            name: templateName,
            language: { code: langCode },
            components: bodyParams.length > 0
                ? [{ type: 'body', parameters: bodyParams.map(textParam) }]
                : []
        }
    })
}

const rupees = (amt) => `Rs. ${Number(amt).toLocaleString('en-IN')}`

// ─── Order Confirmation ──────────────────────────────────────────────────────
// Template: order_confirmation
// Body: Hello {{1}}, your order {{2}} has been confirmed!
//       Total: Rs. {{3}} | Payment: {{4}}
//       We will notify you when it is shipped. Thank you!

export const sendOrderConfirmationWhatsApp = async ({ mobile, name, orderId, totalAmt, paymentMethod }) => {
    const phone = formatPhone(mobile)
    if (!phone) return
    const isCOD = String(paymentMethod).toUpperCase().includes('CASH')
    return sendTemplate(phone, 'order_confirmation', 'en_US', [
        name || 'Customer',
        orderId,
        rupees(totalAmt),
        isCOD ? 'Cash on Delivery' : 'Online (Paid)',
    ])
}

// ─── COD Verification ───────────────────────────────────────────────────────
// Template: cod_verification
// Body: Hi {{1}}, your COD order {{2}} is confirmed.
//       Please keep Rs. {{3}} ready at the time of delivery.
//       If you did not place this order, contact us immediately.

export const sendCODVerificationWhatsApp = async ({ mobile, name, orderId, totalAmt }) => {
    const phone = formatPhone(mobile)
    if (!phone) return
    return sendTemplate(phone, 'cod_verification', 'en', [
        name || 'Customer',
        orderId,
        rupees(totalAmt),
    ])
}

// ─── Order Status Update ─────────────────────────────────────────────────────
// Template: order_status_update
// Body: Hi {{1}}, your order {{2}} status has been updated to: {{3}}
//       Order Total: Rs. {{4}}
//       Thank you for shopping with us!

export const sendOrderStatusWhatsApp = async ({ mobile, name, orderId, status, totalAmt }) => {
    const phone = formatPhone(mobile)
    if (!phone) return
    const validStatuses = ['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
    if (!validStatuses.includes(status)) return
    return sendTemplate(phone, 'order_status_update', 'en', [
        name || 'Customer',
        orderId,
        status,
        rupees(totalAmt),
    ])
}

// ─── Return Status Update ────────────────────────────────────────────────────
// Template: return_status_update
// Body: Hi {{1}}, your return request for order {{2}} has been updated to: {{3}}
//       Refund Amount: Rs. {{4}}
//       Thank you for your patience!

export const sendReturnStatusWhatsApp = async ({ mobile, name, orderId, status, refundAmount, paymentMethod }) => {
    const phone = formatPhone(mobile)
    if (!phone) return
    const validStatuses = ['Approved', 'Pick Up Scheduled', 'Rejected', 'Refund Initiated', 'Refunded']
    if (!validStatuses.includes(status)) return
    return sendTemplate(phone, 'return_status_update', 'en', [
        name || 'Customer',
        orderId || '',
        status,
        rupees(refundAmount || 0),
    ])
}
