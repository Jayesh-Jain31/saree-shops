const esc = (str) => {
    if (!str) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const orderConfirmationTemplate = ({ orderId, items, totalAmt, payment_status }) => {
    const itemRows = items.map(item => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">
                <img src="${esc(item.product_details?.image?.[0] || '')}" alt="" width="40" height="40" style="border-radius:6px;object-fit:contain;" />
            </td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-size:14px;">
                ${esc(item.product_details?.name || 'Product')}
            </td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">
                ${Number(item.quantity) || 1}
            </td>
        </tr>
    `).join('')

    return `
    <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <div style="background:#16a34a;padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Order Confirmed!</h1>
        </div>
        <div style="padding:24px;">
            <p style="color:#333;font-size:15px;margin-bottom:4px;">Your order has been placed successfully.</p>
            <p style="color:#888;font-size:13px;margin-bottom:20px;">Order ID: <strong>${esc(orderId)}</strong></p>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <thead>
                    <tr style="background:#f9fafb;">
                        <th style="padding:8px;text-align:left;font-size:12px;color:#888;"></th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#888;">Item</th>
                        <th style="padding:8px;text-align:center;font-size:12px;color:#888;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;margin-bottom:16px;">
                <p style="margin:0;color:#888;font-size:12px;">Total Amount</p>
                <p style="margin:4px 0 0;color:#16a34a;font-size:22px;font-weight:bold;">₹${Number(totalAmt).toLocaleString('en-IN')}</p>
            </div>

            <p style="color:#888;font-size:13px;text-align:center;">
                Payment: <strong>${payment_status === 'PAID' ? 'Online (Razorpay)' : 'Cash on Delivery'}</strong>
            </p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#aaa;font-size:12px;">Thank you for shopping with Binkeyit!</p>
        </div>
    </div>
    `
}

export default orderConfirmationTemplate
