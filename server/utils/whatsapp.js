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

const rupees = (amt) => `₹${Number(amt).toLocaleString('en-IN')}`

export const sendOrderConfirmationWhatsApp = async ({ mobile, name, orderId, totalAmt, paymentMethod, items }) => {
    const phone = formatPhone(mobile)
    if (!phone) return

    const isCOD = String(paymentMethod).toUpperCase().includes('CASH')
    const itemLines = (items || []).slice(0, 3).map(i =>
        `• ${i.product_details?.name || 'Item'} x${i.quantity || 1}`
    ).join('\n')
    const moreItems = (items || []).length > 3 ? `\n+ ${(items || []).length - 3} more item(s)` : ''

    const text = [
        `🛍️ *Order Confirmed!*`,
        ``,
        `Hello ${name || 'Customer'},`,
        `Your order has been placed successfully. 🎉`,
        ``,
        `*Order ID:* ${orderId}`,
        `*Items:*`,
        itemLines + moreItems,
        ``,
        `*Total:* ${rupees(totalAmt)}`,
        `*Payment:* ${isCOD ? '💵 Cash on Delivery' : '💳 Online (Paid)'}`,
        ``,
        isCOD
            ? `💡 *COD Reminder:* Please keep *${rupees(totalAmt)}* ready at the time of delivery.`
            : `✅ Your payment of ${rupees(totalAmt)} has been received.`,
        ``,
        `We will notify you when your order is shipped. Thank you for shopping with us! 🙏`
    ].join('\n')

    return sendWhatsApp(phone, { type: 'text', text: { body: text, preview_url: false } })
}

export const sendCODVerificationWhatsApp = async ({ mobile, name, orderId, totalAmt }) => {
    const phone = formatPhone(mobile)
    if (!phone) return

    const text = [
        `📦 *COD Order Verification*`,
        ``,
        `Hi ${name || 'Customer'},`,
        `We received your Cash on Delivery order.`,
        ``,
        `*Order ID:* ${orderId}`,
        `*Amount to pay on delivery:* ${rupees(totalAmt)}`,
        ``,
        `⚠️ Please ensure someone is available to receive the package and pay *${rupees(totalAmt)}* in cash.`,
        ``,
        `If you did not place this order, reply to this message or contact our support immediately.`,
        ``,
        `Thank you! 🙏`
    ].join('\n')

    return sendWhatsApp(phone, { type: 'text', text: { body: text, preview_url: false } })
}

export const sendOrderStatusWhatsApp = async ({ mobile, name, orderId, status, totalAmt }) => {
    const phone = formatPhone(mobile)
    if (!phone) return

    const statusMessages = {
        'Confirmed': {
            emoji: '✅',
            headline: 'Order Confirmed',
            body: `Your order has been confirmed and is being prepared.`
        },
        'Shipped': {
            emoji: '📦',
            headline: 'Order Shipped!',
            body: `Great news! Your order is on its way. Our delivery partner has picked it up.`
        },
        'Out for Delivery': {
            emoji: '🚚',
            headline: 'Out for Delivery!',
            body: `Your order is out for delivery and will reach you today. Please be available at the delivery address.`
        },
        'Delivered': {
            emoji: '🎉',
            headline: 'Order Delivered!',
            body: `Your order has been delivered successfully. We hope you love your purchase!\n\nIf you have any issues, you can request a return from the Orders section in our app.`
        },
        'Cancelled': {
            emoji: '❌',
            headline: 'Order Cancelled',
            body: `Your order has been cancelled. If you paid online, your refund will be processed within 5–7 business days. For COD orders, no payment was collected.`
        }
    }

    const info = statusMessages[status]
    if (!info) return

    const text = [
        `${info.emoji} *${info.headline}*`,
        ``,
        `Hi ${name || 'Customer'},`,
        ``,
        info.body,
        ``,
        `*Order ID:* ${orderId}`,
        `*Order Total:* ${rupees(totalAmt)}`,
        ``,
        `Thank you for shopping with us! 🙏`
    ].join('\n')

    return sendWhatsApp(phone, { type: 'text', text: { body: text, preview_url: false } })
}

export const sendReturnStatusWhatsApp = async ({ mobile, name, orderId, status, refundAmount, paymentMethod }) => {
    const phone = formatPhone(mobile)
    if (!phone) return

    const isCOD = String(paymentMethod).toUpperCase() === 'COD'

    const statusMessages = {
        'Approved': {
            emoji: '✅',
            headline: 'Return Approved',
            body: `Your return request has been approved! We will schedule a pickup soon.`
        },
        'Pick Up Scheduled': {
            emoji: '🚚',
            headline: 'Pickup Scheduled',
            body: `Our pickup agent will collect the item(s) from your delivery address. Please keep the items ready and packed.`
        },
        'Rejected': {
            emoji: '❌',
            headline: 'Return Rejected',
            body: `Unfortunately, your return request has been rejected. Please contact our support team for more details.`
        },
        'Refund Initiated': {
            emoji: '💳',
            headline: 'Refund Initiated',
            body: isCOD
                ? `Your refund is being processed to your wallet.`
                : `Your refund of ${rupees(refundAmount)} has been initiated to your original payment method. It will reflect in 5–7 business days.`
        },
        'Refunded': {
            emoji: '💰',
            headline: 'Refund Completed!',
            body: isCOD
                ? `*${rupees(refundAmount)}* has been credited to your wallet instantly! You can use it for your next purchase.`
                : `Your refund of *${rupees(refundAmount)}* has been processed to your original payment method. It may take 5–7 business days to reflect.`
        }
    }

    const info = statusMessages[status]
    if (!info) return

    const text = [
        `${info.emoji} *Return Update: ${info.headline}*`,
        ``,
        `Hi ${name || 'Customer'},`,
        ``,
        info.body,
        ``,
        `*Order ID:* ${orderId}`,
        refundAmount > 0 ? `*Refund Amount:* ${rupees(refundAmount)}` : '',
        ``,
        `Thank you for your patience! 🙏`
    ].filter(Boolean).join('\n')

    return sendWhatsApp(phone, { type: 'text', text: { body: text, preview_url: false } })
}
