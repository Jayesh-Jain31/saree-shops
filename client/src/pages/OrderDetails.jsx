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
  FaPhoneAlt, FaRegCopy, FaDownload, FaUndoAlt
} from 'react-icons/fa'
import {
  MdAccessTime, MdLocationOn, MdDeliveryDining, MdDone,
  MdInventory, MdPending, MdLocalShipping
} from 'react-icons/md'

const RETURN_REASONS = [
  'Damaged / Defective product',
  'Wrong item delivered',
  'Item not as described',
  'Missing items in order',
  'Changed my mind',
  'Other'
]

const returnStatusConfig = {
  'Pending':          'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Approved':         'bg-blue-50 text-blue-700 border-blue-200',
  'Rejected':         'bg-red-50 text-red-700 border-red-200',
  'Refund Initiated': 'bg-purple-50 text-purple-700 border-purple-200',
  'Refunded':         'bg-green-50 text-green-700 border-green-200',
}

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
  const [existingReturn, setExistingReturn] = useState(null)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnDesc, setReturnDesc] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getOrderById,
        url: `${SummaryApi.getOrderById.url}/${id}`
      })
      if (response.data.success) {
        const orderData = response.data.data
        setOrder(orderData)
        if (orderData.orderStatus === 'Delivered') {
          fetchReturnStatus(orderData._id)
        }
      }
    } catch (error) {
      toast.error('Failed to load order details')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReturnStatus = async (oid) => {
    try {
      const res = await Axios({
        ...SummaryApi.getReturnByOrderId,
        url: `${SummaryApi.getReturnByOrderId.url}/${oid}`
      })
      if (res.data.success) setExistingReturn(res.data.data)
    } catch {}
  }

  useEffect(() => {
    if (id) fetchOrderDetails()
  }, [id])

  const handleSubmitReturn = async () => {
    if (!returnReason) { toast.error('Please select a reason'); return }
    try {
      setSubmittingReturn(true)
      const res = await Axios({
        ...SummaryApi.createReturnRequest,
        data: { orderId: order._id, reason: returnReason, description: returnDesc }
      })
      if (res.data.success) {
        toast.success('Return request submitted!')
        setExistingReturn(res.data.data)
        setShowReturnForm(false)
        setReturnReason('')
        setReturnDesc('')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit return request')
    } finally {
      setSubmittingReturn(false)
    }
  }

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

  const esc = (str) => {
    if (!str) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  const handleDownloadInvoice = () => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order?.orderId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: 700; color: #16a34a; }
          .invoice-title { font-size: 28px; font-weight: 700; color: #333; text-align: right; }
          .invoice-meta { text-align: right; font-size: 13px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .address { font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
          .text-right { text-align: right; }
          .totals { margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .total-row.grand { border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #16a34a; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #999; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .badge-amber { background: #fef3c7; color: #d97706; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Binkeyit</div>
            <p style="font-size:12px;color:#999;margin-top:4px">Quick Commerce</p>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              <div>#${order?.orderId}</div>
              <div>${formatFullDate(order?.createdAt)}</div>
            </div>
          </div>
        </div>

        ${addr ? `
        <div class="section">
          <div class="section-title">Delivery Address</div>
          <div class="address">
            ${esc(addr.address_line)}<br>
            ${[esc(addr.city), esc(addr.state)].filter(Boolean).join(', ')}<br>
            ${[esc(addr.country), esc(addr.pincode)].filter(Boolean).join(' - ')}
            ${addr.mobile ? `<br>Phone: ${esc(addr.mobile)}` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Payment</div>
          <span class="badge ${order?.payment_status?.toUpperCase() === 'PAID' ? 'badge-green' : 'badge-amber'}">
            ${order?.payment_status?.toUpperCase() === 'PAID' ? 'Paid Online' : 'Cash on Delivery'}
          </span>
        </div>

        <div class="section">
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${esc(item.product_details?.name || 'Product')}</td>
                  <td class="text-right">${item.quantity || 1}</td>
                  <td class="text-right">${DisplayPriceInRupees(item.price || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${DisplayPriceInRupees(order?.subTotalAmt)}</span>
          </div>
          ${order?.discountAmt > 0 ? `
          <div class="total-row">
            <span>Discount</span>
            <span style="color:#16a34a">- ${DisplayPriceInRupees(order.discountAmt)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span>Delivery</span>
            <span style="color:#16a34a">FREE</span>
          </div>
          <div class="total-row grand">
            <span>Grand Total</span>
            <span>${DisplayPriceInRupees(order?.totalAmt)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Binkeyit!</p>
          <p style="margin-top:4px">This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 300)
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
  const items = order?.items || []
  const totalItemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const nonCancellableStatuses = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
  const canCancel = order?.orderStatus && !nonCancellableStatuses.includes(order.orderStatus)
  const isShippedOrBeyond = ['Shipped', 'Out for Delivery'].includes(order?.orderStatus)

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
        {/* Items Card */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
            <FaShoppingBag className='text-green-600' size={14} />
            Items Ordered
            <span className='text-xs font-normal text-gray-400'>({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})</span>
          </h2>
          <div className='space-y-3'>
            {items.map((item, i) => (
              <div key={i} className={`flex gap-3 ${i < items.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}>
                <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-lg border bg-gray-50 overflow-hidden flex-shrink-0 p-1'>
                  <img
                    src={item.product_details?.image?.[0]}
                    alt={item.product_details?.name}
                    className='w-full h-full object-contain'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-gray-800 text-sm leading-snug line-clamp-2'>
                    {item.product_details?.name}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    Qty: {item.quantity || 1}
                  </p>
                  {item.price > 0 && (
                    <p className='text-sm font-semibold text-gray-700 mt-1'>
                      {DisplayPriceInRupees(item.price)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500'>Items</span>
              <span className='text-xs text-gray-700'>{totalItemCount} item{totalItemCount !== 1 ? 's' : ''}</span>
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

        {/* Download Invoice */}
        <button
          onClick={handleDownloadInvoice}
          className='w-full bg-white rounded-xl border p-4 flex items-center justify-center gap-2 text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors'
        >
          <FaDownload size={14} /> Download Invoice / Receipt
        </button>

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
        {isShippedOrBeyond && (
          <div className='bg-indigo-50 rounded-xl border border-indigo-200 p-4 flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0'>
              <MdLocalShipping className='text-indigo-500' size={18} />
            </div>
            <div>
              <p className='font-semibold text-indigo-800 text-sm'>Order has been shipped</p>
              <p className='text-xs text-indigo-600 mt-0.5'>You cannot cancel this order as it is already on its way to you.</p>
            </div>
          </div>
        )}

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

        {/* Return & Refund */}
        {order?.orderStatus === 'Delivered' && (
          <div className='bg-white rounded-xl border p-4'>
            <h2 className='font-bold text-gray-800 text-sm mb-3 flex items-center gap-2'>
              <FaUndoAlt className='text-orange-500' size={13} /> Return & Refund
            </h2>

            {existingReturn ? (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${returnStatusConfig[existingReturn.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {existingReturn.status}
                  </span>
                  <span className='text-[11px] text-gray-400'>
                    Submitted {new Date(existingReturn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className='text-xs text-gray-600'><span className='font-semibold'>Reason:</span> {existingReturn.reason}</p>
                {existingReturn.description && (
                  <p className='text-xs text-gray-500 italic mt-0.5'>"{existingReturn.description}"</p>
                )}
                {existingReturn.adminNote && (
                  <p className='text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2 border border-gray-100'>
                    <span className='font-semibold'>Note from team:</span> {existingReturn.adminNote}
                  </p>
                )}
                {existingReturn.status === 'Refunded' && existingReturn.refundAmount > 0 && (
                  <p className='text-sm font-bold text-green-700 mt-2'>
                    Refunded: {DisplayPriceInRupees(existingReturn.refundAmount)}
                  </p>
                )}
              </div>
            ) : showReturnForm ? (
              <div className='space-y-3'>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Reason for return *</label>
                  <select
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className='w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-gray-50'
                  >
                    <option value=''>Select a reason...</option>
                    {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Additional details (optional)</label>
                  <textarea
                    value={returnDesc}
                    onChange={e => setReturnDesc(e.target.value)}
                    rows={3}
                    placeholder='Describe the issue in more detail...'
                    className='w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none bg-gray-50'
                  />
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => { setShowReturnForm(false); setReturnReason(''); setReturnDesc('') }}
                    className='flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50'
                    disabled={submittingReturn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReturn}
                    disabled={submittingReturn || !returnReason}
                    className='flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1'
                  >
                    {submittingReturn ? 'Submitting...' : <><FaUndoAlt size={11} /> Submit Return</>}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className='text-xs text-gray-500 mb-3'>
                  Not happy with your order? You can request a return within 7 days of delivery.
                </p>
                <button
                  onClick={() => setShowReturnForm(true)}
                  className='w-full py-3 text-orange-600 font-semibold text-sm border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2'
                >
                  <FaUndoAlt size={12} /> Request Return / Refund
                </button>
              </div>
            )}
          </div>
        )}

        <div className='h-4'></div>
      </div>
    </div>
  )
}

export default OrderDetails
