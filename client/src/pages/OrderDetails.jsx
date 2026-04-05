import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { useGlobalContext } from '../provider/GlobalProvider'
import toast from 'react-hot-toast'
import {
  FaArrowLeft, FaCheckCircle, FaMoneyBillWave, FaCreditCard,
  FaReceipt, FaTruck, FaTimes, FaShoppingBag, FaBoxOpen,
  FaPhoneAlt, FaRegCopy
} from 'react-icons/fa'
import {
  MdAccessTime, MdLocationOn, MdDeliveryDining, MdDone,
  MdInventory, MdPending, MdLocalShipping
} from 'react-icons/md'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

const formatFullDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

const statusSteps = [
  { key: 'Pending', label: 'Order Placed', icon: <FaShoppingBag size={14} /> },
  { key: 'Confirmed', label: 'Confirmed', icon: <FaCheckCircle size={14} /> },
  { key: 'Shipped', label: 'Shipped', icon: <MdInventory size={16} /> },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: <MdLocalShipping size={16} /> },
  { key: 'Delivered', label: 'Delivered', icon: <MdDeliveryDining size={16} /> },
]

const statusOrder = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered']

const OrderTimeline = ({ currentStatus }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3'>
        <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
          <FaTimes className='text-red-500' size={16} />
        </div>
        <div>
          <p className='font-semibold text-red-700'>Order Cancelled</p>
          <p className='text-xs text-red-500'>This order has been cancelled</p>
        </div>
      </div>
    )
  }

  const currentIndex = statusOrder.indexOf(currentStatus)

  return (
    <div className='py-2'>
      {statusSteps.map((step, i) => {
        const isDone = i <= currentIndex
        const isCurrent = i === currentIndex
        const isLast = i === statusSteps.length - 1

        return (
          <div key={step.key} className='flex'>
            {/* Timeline column */}
            <div className='flex flex-col items-center mr-4'>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                ${isDone
                  ? isCurrent
                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                    : 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-200 text-gray-300'
                }`}>
                {isDone && !isCurrent ? <MdDone size={16} /> : step.icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-8 my-1 ${isDone && i < currentIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-sm font-semibold ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {isCurrent && (
                <p className='text-[11px] text-green-600 font-medium mt-0.5'>Current Status</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchOrder } = useGlobalContext()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getOrderById,
        url: `${SummaryApi.getOrderById.url}/${id}`
      })
      if (response.data.success) {
        setOrder(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to load order details')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrderDetails()
  }, [id])

  const handleCancelOrder = async () => {
    try {
      setCancelling(true)
      const response = await Axios({
        ...SummaryApi.cancelOrder,
        url: `${SummaryApi.cancelOrder.url}/${id}`
      })
      if (response.data.success) {
        toast.success('Order cancelled successfully')
        setOrder(response.data.data)
        setShowCancelConfirm(false)
        fetchOrder()
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const copyOrderId = () => {
    if (order?.orderId) {
      navigator.clipboard.writeText(order.orderId)
      toast.success('Order ID copied!')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3'></div>
          <p className='text-sm text-gray-500'>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
        <FaBoxOpen className='text-gray-300 mb-3' size={48} />
        <p className='font-semibold text-gray-600 mb-1'>Order not found</p>
        <p className='text-sm text-gray-400 mb-4'>This order may not exist or you don't have access</p>
        <button
          onClick={() => navigate('/dashboard/myorders')}
          className='bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700'
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const addr = order?.delivery_address
  const canCancel = order?.orderStatus && !['Delivered', 'Cancelled'].includes(order.orderStatus)

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='max-w-3xl mx-auto p-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => navigate('/dashboard/myorders')}
              className='w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
            >
              <FaArrowLeft size={14} className='text-gray-600' />
            </button>
            <div className='flex-1 min-w-0'>
              <h1 className='font-bold text-lg text-gray-800'>Order Details</h1>
              <div className='flex items-center gap-1.5'>
                <p className='text-[11px] font-mono text-gray-400 truncate'>{order?.orderId}</p>
                <button onClick={copyOrderId} className='text-gray-300 hover:text-green-500 transition-colors'>
                  <FaRegCopy size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-3xl mx-auto p-4 space-y-4'>
        {/* Product Card */}
        <div className='bg-white rounded-xl border p-4'>
          <div className='flex gap-4'>
            <div className='w-28 h-28 rounded-xl border bg-gray-50 overflow-hidden flex-shrink-0 p-1.5'>
              <img
                src={order.product_details?.image?.[0]}
                alt={order.product_details?.name}
                className='w-full h-full object-contain'
              />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-bold text-gray-800 text-base leading-snug line-clamp-2'>
                {order.product_details?.name}
              </p>
              <p className='text-xs text-gray-400 mt-1'>
                Qty: {order?.quantity || 1}
              </p>
              <p className='text-xl font-bold text-green-700 mt-2'>
                {DisplayPriceInRupees(order?.totalAmt)}
              </p>
            </div>
          </div>

          {/* Product Gallery */}
          {order.product_details?.image?.length > 1 && (
            <div className='flex gap-2 mt-3 overflow-x-auto pb-1'>
              {order.product_details.image.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${i + 1}`}
                  className='w-14 h-14 object-contain rounded-lg border bg-gray-50 flex-shrink-0 p-0.5'
                />
              ))}
            </div>
          )}
        </div>

        {/* Order Tracking */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
            <FaTruck className='text-green-600' size={14} /> Order Tracking
          </h2>
          <OrderTimeline currentStatus={order?.orderStatus} />
        </div>

        {/* Order Info */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
            <FaReceipt className='text-green-600' size={14} /> Order Information
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Order ID</span>
              <span className='text-xs font-mono font-semibold text-gray-700'>{order?.orderId}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Placed on</span>
              <span className='text-xs text-gray-700'>{formatFullDate(order?.createdAt)}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Time</span>
              <span className='text-xs text-gray-700'>{formatTime(order?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-gray-800 text-sm mb-3'>Price Breakdown</h2>
          <div className='space-y-2.5'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Subtotal</span>
              <span className='text-gray-700'>{DisplayPriceInRupees(order?.subTotalAmt)}</span>
            </div>
            {order?.discountAmt > 0 && (
              <div className='flex justify-between text-sm'>
                <span className='text-gray-500'>Discount</span>
                <span className='text-green-600 font-medium'>- {DisplayPriceInRupees(order.discountAmt)}</span>
              </div>
            )}
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Delivery</span>
              <span className='text-green-600 font-medium'>FREE</span>
            </div>
            <div className='border-t pt-2.5 flex justify-between'>
              <span className='font-bold text-gray-800'>Grand Total</span>
              <span className='font-bold text-green-700 text-lg'>{DisplayPriceInRupees(order?.totalAmt)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
            <FaCreditCard className='text-green-600' size={13} /> Payment
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Method</span>
              <span className='text-xs font-semibold text-gray-700'>
                {order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY' ? 'Cash on Delivery' : 'Razorpay (Online)'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Status</span>
              {order?.payment_status?.toUpperCase() === 'PAID' ? (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200'>
                  <FaCheckCircle size={9} /> Paid
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
                  <FaMoneyBillWave size={9} /> Pay on Delivery
                </span>
              )}
            </div>
            {order?.paymentId && order.paymentId !== '' && (
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-500'>Transaction ID</span>
                <span className='text-[11px] font-mono text-gray-600 break-all text-right max-w-[200px]'>{order.paymentId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        {addr && (
          <div className='bg-white rounded-xl border p-4'>
            <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
              <MdLocationOn className='text-red-500' size={16} /> Delivery Address
            </h2>
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='text-sm text-gray-700 leading-relaxed'>
                {addr?.address_line}
              </p>
              <p className='text-sm text-gray-600'>
                {[addr?.city, addr?.state].filter(Boolean).join(', ')}
              </p>
              <p className='text-sm text-gray-600'>
                {[addr?.country, addr?.pincode].filter(Boolean).join(' - ')}
              </p>
              {addr?.mobile && (
                <p className='text-sm text-gray-700 mt-2 flex items-center gap-1.5'>
                  <FaPhoneAlt size={10} className='text-gray-400' />
                  {addr.mobile}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cancel Order */}
        {canCancel && (
          <div className='bg-white rounded-xl border p-4'>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className='w-full py-3 text-red-600 font-semibold text-sm border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2'
              >
                <FaTimes size={12} /> Cancel Order
              </button>
            ) : (
              <div>
                <p className='text-sm font-semibold text-gray-800 mb-1'>Cancel this order?</p>
                <p className='text-xs text-gray-500 mb-3'>This action cannot be undone.{order?.payment_status?.toUpperCase() === 'PAID' ? ' For refund queries, please contact support.' : ''}</p>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className='flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50'
                    disabled={cancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className='flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50'
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom spacing */}
        <div className='h-4'></div>
      </div>
    </div>
  )
}

export default OrderDetails
