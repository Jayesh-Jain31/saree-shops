const esc = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''

const statusColors = {
    'Confirmed':        { bg: '#dbeafe', text: '#1d4ed8', emoji: '✅' },
    'Shipped':          { bg: '#e0e7ff', text: '#4338ca', emoji: '📦' },
    'Out for Delivery': { bg: '#ede9fe', text: '#7c3aed', emoji: '🚚' },
    'Delivered':        { bg: '#dcfce7', text: '#16a34a', emoji: '🎉' },
    'Cancelled':        { bg: '#fee2e2', text: '#dc2626', emoji: '❌' },
    'Pending':          { bg: '#fef9c3', text: '#a16207', emoji: '⏳' },
}

const statusMessages = {
    'Confirmed':        'Great news! Your order has been confirmed and is being prepared.',
    'Shipped':          'Your order is on its way! It has been handed over to the courier.',
    'Out for Delivery': 'Your order is out for delivery today. Please be available to receive it.',
    'Delivered':        'Your order has been delivered. We hope you love your purchase!',
    'Cancelled':        'Your order has been cancelled. Any payment will be refunded shortly.',
    'Pending':          'Your order is pending and will be confirmed shortly.',
}

const orderStatusTemplate = ({ orderId, status, customerName, totalAmt }) => {
    const cfg = statusColors[status] || statusColors['Pending']
    const message = statusMessages[status] || 'Your order status has been updated.'

    return `
    <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <div style="background:#16a34a;padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Order Update</h1>
            <p style="color:#bbf7d0;margin:6px 0 0;font-size:13px;">Sarees Store</p>
        </div>
        <div style="padding:24px;">
            <p style="color:#333;font-size:15px;margin-bottom:16px;">
                Hi <strong>${esc(customerName || 'Customer')}</strong>,
            </p>
            <div style="background:${cfg.bg};border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
                <div style="font-size:36px;margin-bottom:8px;">${cfg.emoji}</div>
                <p style="color:${cfg.text};font-size:18px;font-weight:bold;margin:0;">${esc(status)}</p>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:20px;">${message}</p>
            <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:16px;">
                <p style="margin:0 0 6px;color:#888;font-size:12px;">Order ID</p>
                <p style="margin:0;color:#333;font-size:14px;font-weight:bold;font-family:monospace;">${esc(orderId)}</p>
                ${totalAmt ? `
                <p style="margin:10px 0 6px;color:#888;font-size:12px;">Amount</p>
                <p style="margin:0;color:#16a34a;font-size:16px;font-weight:bold;">₹${Number(totalAmt).toLocaleString('en-IN')}</p>
                ` : ''}
            </div>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#aaa;font-size:12px;">Thank you for shopping with Sarees Store!</p>
        </div>
    </div>
    `
}

export default orderStatusTemplate
