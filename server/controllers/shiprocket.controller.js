import { shiprocketPost, shiprocketGet } from '../config/shiprocket.js'
import OrderModel from '../models/order.model.js'

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
