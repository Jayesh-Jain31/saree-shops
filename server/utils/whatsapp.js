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
    if (!ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.log('[WhatsApp] Missing credentials — WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set')
        return
    }
    const phone = formatPhone(to)
    if (!phone) {
        console.log('[WhatsApp] Invalid phone number:', to)
        return
    }

    const body = JSON.stringify({ messaging_product: 'whatsapp', to: phone, ...payload })
    console.log('[WhatsApp] Sending to:', phone, '| Template:', payload?.template?.name || 'free-text')

    try {
        const res = await fetch(WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body
        })
        const data = await res.json()
        if (!res.ok) {
            console.log('[WhatsApp] API error:', JSON.stringify(data?.error || data))
        } else {
            console.log('[WhatsApp] Sent successfully to:', phone)
        }
        return data
    } catch (err) {
        console.log('[WhatsApp] Network error:', err.message)
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

// ─── Admin Alert helpers ─────────────────────────────────────────────────────
export const sendAdminNewOrderAlert = async (adminPhone, { orderId, customerName, customerMobile, totalAmt, paymentMethod, itemCount }) => {
    if (!adminPhone) return
    const isCOD = String(paymentMethod).toUpperCase().includes('CASH') || String(paymentMethod).toUpperCase().includes('COD')
    return sendWhatsApp(formatPhone(adminPhone), {
        type: 'text',
        text: {
            body: `🛍️ *NEW ORDER RECEIVED!*\n\nOrder ID: *${orderId}*\nCustomer: ${customerName || 'Unknown'}\nPhone: ${customerMobile || 'N/A'}\nItems: ${itemCount || 1}\nTotal: *${rupees(totalAmt)}*\nPayment: ${isCOD ? '💵 Cash on Delivery' : '✅ Online (Paid)'}\n\nCheck admin dashboard for details.`
        }
    })
}

export const sendAdminNewReturnAlert = async (adminPhone, { orderId, customerName, customerMobile, reason, totalAmt }) => {
    if (!adminPhone) return
    return sendWhatsApp(formatPhone(adminPhone), {
        type: 'text',
        text: {
            body: `🔄 *NEW RETURN REQUEST!*\n\nOrder ID: *${orderId}*\nCustomer: ${customerName || 'Unknown'}\nPhone: ${customerMobile || 'N/A'}\nReason: ${reason || 'Not specified'}\nAmount: *${rupees(totalAmt)}*\n\nPlease review in admin dashboard.`
        }
    })
}

export const sendAdminLowStockAlert = async (adminPhone, lowStockItems) => {
    if (!adminPhone || !lowStockItems?.length) return
    const lines = lowStockItems.map(p => `• ${p.name}: *${p.stock} left*`).join('\n')
    return sendWhatsApp(formatPhone(adminPhone), {
        type: 'text',
        text: {
            body: `⚠️ *LOW STOCK ALERT!*\n\nThe following products are running low:\n\n${lines}\n\nPlease restock soon.`
        }
    })
}

export const sendFreeTextWhatsApp = async (phone, message) => {
    if (!phone || !message) return
    return sendWhatsApp(phone, {
        type: 'text',
        text: { body: message }
    })
}

// ─── Order Confirmation ──────────────────────────────────────────────────────
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
