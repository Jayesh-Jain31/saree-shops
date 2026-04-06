import { shiprocketPost, shiprocketGet } from '../config/shiprocket.js'
import OrderModel from '../models/order.model.js'
import AddressModel from '../models/address.model.js'
import UserModel from '../models/user.model.js'

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

        const addr = order.delivery_address || {}
        const user = order.userId || {}
        const items = order.items || []

        const payload = {
            order_id: order.orderId,
            order_date: new Date(order.createdAt).toISOString().split('T')[0],
            pickup_location: 'Primary',
            channel_id: '',
            comment: 'Binkeyit Order',
            billing_customer_name: user.name || 'Customer',
            billing_last_name: '',
            billing_address: addr.address_line || '',
            billing_address_2: '',
            billing_city: addr.city || '',
            billing_pincode: addr.pincode || '',
            billing_state: addr.state || '',
            billing_country: addr.country || 'India',
            billing_email: user.email || '',
            billing_phone: addr.mobile || user.mobile || '',
            shipping_is_billing: true,
            order_items: items.map(item => ({
                name: item.product_details?.name || 'Product',
                sku: item.productId?.toString() || 'SKU',
                units: item.quantity || 1,
                selling_price: item.price || 0,
                discount: 0,
                tax: 0,
                hsn: 0,
            })),
            payment_method: order.payment_status?.toUpperCase() === 'CASH ON DELIVERY' ? 'COD' : 'Prepaid',
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: order.discountAmt || 0,
            sub_total: order.subTotalAmt || 0,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
        }

        const data = await shiprocketPost('/orders/create/adhoc', payload)

        if (!data.order_id) {
            return response.status(400).json({
                message: data.message || 'Shiprocket order creation failed',
                error: true,
                success: false
            })
        }

        order.shiprocketOrderId = String(data.order_id)
        order.shipmentId = String(data.shipment_id || '')
        order.orderStatus = 'Shipped'
        await order.save()

        return response.json({
            message: 'Shipment created successfully on Shiprocket',
            data: { shiprocketOrderId: order.shiprocketOrderId, shipmentId: order.shipmentId },
            error: false,
            success: true
        })
    } catch (error) {
        const msg = error?.response?.data?.message || error.message || 'Shiprocket error'
        return response.status(500).json({ message: msg, error: true, success: false })
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
