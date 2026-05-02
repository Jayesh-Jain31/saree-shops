import { shiprocketPost, shiprocketGet } from '../config/shiprocket.js'
import OrderModel from '../models/order.model.js'
import sendEmail from '../config/sendEmail.js'
import { createNotification } from '../utils/notificationHelper.js'
import { sendFreeTextWhatsApp } from '../utils/whatsapp.js'

// Map Shiprocket status strings → our order status enum
const STATUS_MAP = {
    'SHIPPED':              'Shipped',
    'PICKED UP':            'Shipped',
    'IN TRANSIT':           'Shipped',
    'OUT FOR DELIVERY':     'Out for Delivery',
    'DELIVERED':            'Delivered',
    'UNDELIVERED':          'Shipped',
    'CANCELLED':            'Cancelled',
    'RTO INITIATED':        'Cancelled',
    'RTO DELIVERED':        'Cancelled',
    'RETURN INITIATED':     'Cancelled',
}

// POST /api/shiprocket/webhook  (no auth — called by Shiprocket servers)
export async function shiprocketWebhookController(request, response) {
    try {
        // Shiprocket sends different payload shapes; normalise them
        const body = request.body || {}
        const rawStatus  = (body.current_status || body.status || '').toString().toUpperCase().trim()
        const orderId    = body.order_id || body.awb_assign_status?.order_id || ''
        const awb        = body.awb_code  || body.awb || ''
        const shipmentId = body.shipment_id || ''

        if (!orderId) return response.status(200).json({ success: true, message: 'No order_id, ignored' })

        const mappedStatus = STATUS_MAP[rawStatus]
        if (!mappedStatus) return response.status(200).json({ success: true, message: `Status "${rawStatus}" not mapped, ignored` })

        // Find order — Shiprocket sends our orderId string (e.g. "ORD-xxxx")
        const order = await OrderModel.findOne({ orderId: String(orderId) })
            .populate('userId', 'name email mobile')
            .populate('delivery_address')

        if (!order) {
            // Try by shiprocketOrderId as fallback
            const byShiprocket = await OrderModel.findOne({ shiprocketOrderId: String(orderId) })
                .populate('userId', 'name email mobile')
                .populate('delivery_address')
            if (!byShiprocket) return response.status(200).json({ success: true, message: 'Order not found, ignored' })
            return handleStatusUpdate(byShiprocket, mappedStatus, rawStatus, awb, shipmentId, response)
        }

        return handleStatusUpdate(order, mappedStatus, rawStatus, awb, shipmentId, response)

    } catch (error) {
        console.error('Shiprocket webhook error:', error.message)
        return response.status(200).json({ success: true }) // always 200 so Shiprocket doesn't retry infinitely
    }
}

async function handleStatusUpdate(order, mappedStatus, rawStatus, awb, shipmentId, response) {
    const prevStatus = order.orderStatus

    // Update order
    order.orderStatus = mappedStatus
    if (awb && !order.awbCode)          order.awbCode    = awb
    if (shipmentId && !order.shipmentId) order.shipmentId = String(shipmentId)
    await order.save()

    // Notify customer (only on meaningful status changes)
    const notifyStatuses = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
    if (notifyStatuses.includes(mappedStatus) && mappedStatus !== prevStatus) {
        const user = order.userId || {}
        const name = user.name || 'Customer'
        const statusLabel = mappedStatus
        const trackingMsg = order.awbCode
            ? `\nTracking AWB: ${order.awbCode}`
            : ''

        // WhatsApp
        if (user.mobile) {
            const mobile = String(user.mobile).replace(/\D/g, '').slice(-10)
            const msg = `Hi ${name}, your order ${order.orderId} status has been updated to *${statusLabel}*.${trackingMsg}\n\nThank you for shopping with us! 🛍️`
            sendFreeTextWhatsApp(mobile, msg).catch(() => {})
        }

        // Email
        if (user.email) {
            const subjectMap = {
                'Shipped':          `Your order ${order.orderId} has been shipped! 🚚`,
                'Out for Delivery': `Your order ${order.orderId} is out for delivery! 📦`,
                'Delivered':        `Your order ${order.orderId} has been delivered! ✅`,
                'Cancelled':        `Order ${order.orderId} update`,
            }
            sendEmail({
                sendTo: user.email,
                subject: subjectMap[mappedStatus] || `Order ${order.orderId} update`,
                html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
                    <h2 style="color:#16a34a">Order Update</h2>
                    <p>Hi ${name},</p>
                    <p>Your order <strong>${order.orderId}</strong> status is now: <strong>${statusLabel}</strong>.</p>
                    ${order.awbCode ? `<p>Tracking AWB: <strong>${order.awbCode}</strong></p>` : ''}
                    <p style="margin-top:24px;color:#6b7280;font-size:12px">Thank you for shopping with us!</p>
                </div>`
            }).catch(() => {})
        }
    }

    const shipNotifMap = {
        'Shipped':          `Your order ${order.orderId} has been shipped! 🚚`,
        'Out for Delivery': `Your order ${order.orderId} is out for delivery! 📦`,
        'Delivered':        `Your order ${order.orderId} has been delivered! 🎉`,
        'Cancelled':        `Your order ${order.orderId} has been cancelled.`,
    }
    if (shipNotifMap[mappedStatus] && mappedStatus !== prevStatus) {
        createNotification(order.userId, shipNotifMap[mappedStatus], mappedStatus === 'Cancelled' ? 'warning' : 'success', '/dashboard/myorders').catch(() => {})
    }

    return response.status(200).json({ success: true, message: `Order ${order.orderId} updated to ${mappedStatus}` })
}

export async function createShiprocketOrder(request, response) {
    try {
        const { orderId } = request.body
        const order = await OrderModel.findById(orderId)
            .populate('delivery_address')
            .populate('userId', 'name email mobile')

        if (!order) return response.status(404).json({ message: 'Order not found', error: true, success: false })
        if (order.shiprocketOrderId) {
            return response.status(400).json({ message: 'Shipment already created for this order', error: true, success: false })
        }

        // Auto-detect first available pickup location
        let pickupLocation = 'Primary'
        try {
            const warehouseData = await shiprocketGet('/warehouses')
            const warehouses = warehouseData?.data || warehouseData?.warehouses || []
            if (warehouses.length > 0) {
                pickupLocation = warehouses[0].pickup_location || warehouses[0].name || 'Primary'
            }
        } catch (wErr) {
            if(process.env.NODE_ENV !== 'production') console.log('Could not fetch warehouses, using Primary:', wErr?.response?.data || wErr.message)
        }

        const addr = order.delivery_address || {}
        const user = order.userId || {}
        const items = order.items || []

        const orderDate = new Date(order.createdAt)
        const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth()+1).padStart(2,'0')}-${String(orderDate.getDate()).padStart(2,'0')} ${String(orderDate.getHours()).padStart(2,'0')}:${String(orderDate.getMinutes()).padStart(2,'0')}`

        const payload = {
            order_id: order.orderId,
            order_date: formattedDate,
            pickup_location: pickupLocation,
            billing_customer_name: (user.name || 'Customer').split(' ')[0],
            billing_last_name: (user.name || '').split(' ').slice(1).join(' ') || '',
            billing_address: addr.address_line || 'N/A',
            billing_address_2: '',
            billing_city: addr.city || 'N/A',
            billing_pincode: String(addr.pincode || '000000'),
            billing_state: addr.state || 'N/A',
            billing_country: 'India',
            billing_email: user.email || '',
            billing_phone: String(addr.mobile || user.mobile || '0000000000'),
            shipping_is_billing: true,
            order_items: items.map(item => ({
                name: (item.product_details?.name || 'Product').substring(0, 100),
                sku: item.productId?.toString()?.substring(0, 50) || 'SKU001',
                units: item.quantity || 1,
                selling_price: String(item.price || 0),
                discount: '',
                tax: '',
                hsn: 0
            })),
            payment_method: (order.payment_status || '').toUpperCase().includes('CASH') ? 'COD' : 'Prepaid',
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: order.discountAmt || 0,
            sub_total: order.subTotalAmt || 0,
            length: 15,
            breadth: 15,
            height: 10,
            weight: 0.5
        }

        if(process.env.NODE_ENV !== 'production') console.log('Creating Shiprocket order with payload:', JSON.stringify(payload, null, 2))

        const data = await shiprocketPost('/orders/create/adhoc', payload)
        if(process.env.NODE_ENV !== 'production') console.log('Shiprocket response:', JSON.stringify(data, null, 2))

        if (!data.order_id) {
            const errMsg = data.message || (data.errors ? JSON.stringify(data.errors) : 'Shiprocket order creation failed')
            return response.status(400).json({ message: errMsg, error: true, success: false })
        }

        order.shiprocketOrderId = String(data.order_id)
        order.shipmentId = String(data.shipment_id || '')
        order.awbCode = String(data.awb_code || '')
        order.orderStatus = 'Shipped'
        await order.save()

        return response.json({
            message: 'Shipment created successfully on Shiprocket',
            data: {
                shiprocketOrderId: order.shiprocketOrderId,
                shipmentId: order.shipmentId,
                awbCode: order.awbCode
            },
            error: false,
            success: true
        })
    } catch (error) {
        const errData = error?.response?.data
        const statusCode = error?.response?.status
        console.error('Shiprocket createOrder error:', JSON.stringify(errData || error.message, null, 2))

        if (statusCode === 403 || errData?.status_code === 403) {
            return response.status(403).json({
                message: 'Shiprocket API access is not enabled for your account. Please log in to your Shiprocket panel → Settings → API → Enable API access, then try again.',
                error: true,
                success: false
            })
        }

        const errMsg = errData?.message || (errData?.errors ? JSON.stringify(errData.errors) : null) || error.message || 'Shiprocket error'
        return response.status(500).json({ message: errMsg, error: true, success: false })
    }
}

export async function getShiprocketTracking(request, response) {
    try {
        const { shipmentId } = request.query
        if (!shipmentId) return response.status(400).json({ message: 'shipmentId required', error: true, success: false })
        const data = await shiprocketGet(`/courier/track/shipment/${shipmentId}`)
        return response.json({ data, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getShiprocketWarehouses(request, response) {
    try {
        const data = await shiprocketGet('/warehouses')
        return response.json({ data, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}
