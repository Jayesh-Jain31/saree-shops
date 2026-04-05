import React from 'react'
import { useSelector } from 'react-redux'
import NoData from '../components/NoData'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaBoxOpen, FaCheckCircle, FaTruck, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa'
import { MdAccessTime, MdLocationOn } from 'react-icons/md'

const getPaymentIcon = (status) => {
    if (!status) return null
    const s = status.toUpperCase()
    if (s === 'CASH ON DELIVERY') return <FaMoneyBillWave className='text-orange-500' />
    if (s === 'PAID') return <FaCreditCard className='text-green-500' />
    return <FaCreditCard className='text-blue-500' />
}

const getPaymentBadge = (status) => {
    if (!status) return null
    const s = status.toUpperCase()
    if (s === 'CASH ON DELIVERY') return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700'>
            <FaMoneyBillWave size={10} /> Cash on Delivery
        </span>
    )
    if (s === 'PAID') return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700'>
            <FaCheckCircle size={10} /> Paid Online
        </span>
    )
    return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700'>
            <FaCreditCard size={10} /> {status}
        </span>
    )
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    })
}

const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    })
}

const MyOrders = () => {
    const orders = useSelector(state => state.orders.order)

    return (
        <div className='bg-gray-50 min-h-screen'>
            {/* Header */}
            <div className='bg-white shadow-sm p-4 flex items-center gap-3 border-b'>
                <FaBoxOpen className='text-green-600' size={22} />
                <div>
                    <h1 className='font-bold text-lg text-gray-800'>My Orders</h1>
                    <p className='text-xs text-gray-500'>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
                </div>
            </div>

            {!orders[0] && <NoData />}

            <div className='p-4 space-y-4 max-w-3xl mx-auto'>
                {orders.map((order, index) => (
                    <div
                        key={order._id + index + "order"}
                        className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'
                    >
                        {/* Order Top Bar */}
                        <div className='bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-green-100'>
                            <div className='flex items-center gap-2'>
                                <FaTruck className='text-green-600' size={14} />
                                <span className='text-xs font-mono font-semibold text-gray-600 tracking-wide'>
                                    {order?.orderId}
                                </span>
                            </div>
                            {getPaymentBadge(order?.payment_status)}
                        </div>

                        {/* Product Info */}
                        <div className='p-4 flex gap-4'>
                            <div className='flex-shrink-0'>
                                <img
                                    src={order.product_details?.image?.[0]}
                                    alt={order.product_details?.name}
                                    className='w-20 h-20 object-contain rounded-xl border border-gray-100 bg-gray-50 p-1'
                                />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='font-semibold text-gray-800 text-sm leading-snug line-clamp-2'>
                                    {order.product_details?.name}
                                </p>

                                {/* Date & Time */}
                                <div className='flex items-center gap-1 mt-1.5 text-xs text-gray-400'>
                                    <MdAccessTime size={13} />
                                    <span>{formatDate(order.createdAt)}</span>
                                    <span>·</span>
                                    <span>{formatTime(order.createdAt)}</span>
                                </div>

                                {/* Order Summary */}
                                <div className='mt-3 flex flex-wrap gap-3'>
                                    <div className='bg-gray-50 rounded-lg px-3 py-1.5'>
                                        <p className='text-xs text-gray-400'>Sub Total</p>
                                        <p className='text-sm font-semibold text-gray-700'>
                                            {DisplayPriceInRupees(order?.subTotalAmt)}
                                        </p>
                                    </div>
                                    <div className='bg-green-50 rounded-lg px-3 py-1.5'>
                                        <p className='text-xs text-gray-400'>Amount Paid</p>
                                        <p className='text-sm font-bold text-green-700'>
                                            {DisplayPriceInRupees(order?.totalAmt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        {order?.delivery_address && (
                            <div className='mx-4 mb-4 bg-gray-50 rounded-xl p-3 flex items-start gap-2'>
                                <MdLocationOn className='text-red-400 mt-0.5 flex-shrink-0' size={16} />
                                <div className='text-xs text-gray-600 leading-relaxed'>
                                    <p className='font-semibold text-gray-700 mb-0.5'>Delivery Address</p>
                                    <p>
                                        {[
                                            order.delivery_address?.address_line,
                                            order.delivery_address?.city,
                                            order.delivery_address?.state,
                                            order.delivery_address?.country,
                                            order.delivery_address?.pincode
                                        ].filter(Boolean).join(', ')}
                                    </p>
                                    {order.delivery_address?.mobile && (
                                        <p className='mt-0.5 text-gray-500'>📞 {order.delivery_address.mobile}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment ID Footer */}
                        {order?.paymentId && order.paymentId !== "" && (
                            <div className='px-4 pb-3'>
                                <p className='text-xs text-gray-400'>
                                    Payment ID: <span className='font-mono text-gray-500'>{order.paymentId}</span>
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyOrders
