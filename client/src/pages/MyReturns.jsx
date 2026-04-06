import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
  FaBoxOpen, FaUndoAlt, FaChevronRight, FaTimes,
  FaMapMarkerAlt, FaCreditCard, FaReceipt, FaShoppingBag,
  FaMoneyBillWave, FaWallet, FaCheckCircle, FaTimesCircle, FaInfoCircle
} from 'react-icons/fa'
import { MdPending, MdDone, MdClose, MdLocalAtm } from 'react-icons/md'
import NoData from '../components/NoData'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['Pending', 'Approved', 'Pick Up Scheduled', 'Refund Initiated', 'Refunded']
const REJECTED_STATUS = 'Rejected'

const statusConfig = {
  'Pending':           { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <MdPending size={12} /> },
  'Approved':          { color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <MdDone size={12} /> },
  'Pick Up Scheduled': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <MdDone size={12} /> },
  'Rejected':          { color: 'bg-red-50 text-red-700 border-red-200',          icon: <MdClose size={12} /> },
  'Refund Initiated':  { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <MdLocalAtm size={12} /> },
  'Refunded':          { color: 'bg-green-50 text-green-700 border-green-200',    icon: <MdDone size={12} /> },
}

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Pending']
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
      {cfg.icon} {status}
    </span>
  )
}

const StatusTimeline = ({ status }) => {
  if (status === REJECTED_STATUS) {
    return (
      <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3'>
        <FaTimesCircle className='text-red-500 flex-shrink-0' size={18} />
        <div>
          <p className='text-sm font-bold text-red-700'>Return Rejected</p>
          <p className='text-xs text-red-500'>Your return request was not approved.</p>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.indexOf(status)

  return (
    <div className='flex items-center gap-0'>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <React.Fragment key={step}>
            <div className='flex flex-col items-center'>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done
                  ? active
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}>
                {done && !active ? <MdDone size={14} /> : i + 1}
              </div>
              <p className={`text-[9px] mt-1 text-center leading-tight w-14 ${done ? (active ? 'text-primary font-bold' : 'text-green-600 font-semibold') : 'text-gray-400'}`}>
                {step}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-0.5 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const DetailModal = ({ ret, onClose }) => {
  const order = ret.orderId && typeof ret.orderId === 'object' ? ret.orderId : null
  const addr = order?.delivery_address

  const paymentMethod = ret.paymentMethod ||
    (order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY' ? 'COD' : 'Online')
  const paymentId = ret.paymentId || order?.paymentId || null
  const isCOD = paymentMethod?.toUpperCase() === 'COD'

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const orderTotal = order?.totalAmt || ret.totalAmt || 0
  const subTotal   = order?.subTotalAmt || 0

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
      <div className='bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto'>

        {/* Header */}
        <div className='sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
              <FaUndoAlt className='text-orange-600' size={13} />
            </div>
            <div>
              <p className='font-bold text-gray-800 text-sm'>Return Details</p>
              <p className='text-[11px] text-gray-500'>Order #{ret.orderDisplayId}</p>
            </div>
          </div>
          <button onClick={onClose} className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600'>
            <FaTimes size={14} />
          </button>
        </div>

        <div className='p-4 space-y-4'>

          {/* Status + Timeline */}
          <div className='bg-gray-50 rounded-2xl p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Return Status</p>
              <StatusBadge status={ret.status} />
            </div>
            <StatusTimeline status={ret.status} />
            {ret.status === 'Refunded' && ret.refundAmount > 0 && (
              <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2'>
                <FaCheckCircle className='text-green-500 flex-shrink-0' size={14} />
                <p className='text-sm font-bold text-green-700'>
                  {DisplayPriceInRupees(ret.refundAmount)} refunded {isCOD ? 'to your wallet' : 'to original payment method'}
                </p>
              </div>
            )}
          </div>

          {/* Admin Note */}
          {ret.adminNote && (
            <div className='flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-3'>
              <FaInfoCircle className='text-blue-500 flex-shrink-0 mt-0.5' size={14} />
              <div>
                <p className='text-xs font-bold text-blue-700 mb-0.5'>Store Message</p>
                <p className='text-xs text-blue-700'>{ret.adminNote}</p>
              </div>
            </div>
          )}

          {/* Return Reason */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b'>
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Return Reason</p>
            </div>
            <div className='px-4 py-3 space-y-1'>
              <p className='text-sm font-semibold text-gray-800'>{ret.reason}</p>
              {ret.description && (
                <p className='text-xs text-gray-500 italic'>"{ret.description}"</p>
              )}
              <p className='text-[11px] text-gray-400'>Submitted on {formatDate(ret.createdAt)}</p>
            </div>
          </div>

          {/* Items */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
              <FaShoppingBag className='text-gray-400' size={12} />
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Items Returned</p>
            </div>
            <div className='divide-y divide-gray-50'>
              {ret.items?.map((item, i) => (
                <div key={i} className='flex items-center gap-3 px-4 py-3'>
                  <div className='w-14 h-14 rounded-xl border bg-gray-50 p-1 flex-shrink-0'>
                    <img
                      src={item.product_details?.image?.[0]}
                      alt={item.product_details?.name}
                      className='w-full h-full object-contain'
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-800 line-clamp-2 leading-snug'>{item.product_details?.name}</p>
                    <p className='text-xs text-gray-400 mt-0.5'>Qty: {item.quantity}</p>
                  </div>
                  {item.price > 0 && (
                    <p className='text-sm font-bold text-gray-800 flex-shrink-0'>{DisplayPriceInRupees(item.price * item.quantity)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
              <FaCreditCard className='text-gray-400' size={12} />
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Payment Details</p>
            </div>
            <div className='px-4 py-3 space-y-2.5'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-500'>Payment Method</span>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${isCOD ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                  {isCOD ? <FaMoneyBillWave size={11} /> : <FaCreditCard size={11} />}
                  {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              {!isCOD && paymentId && (
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>Payment ID</span>
                  <span className='text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded'>{paymentId}</span>
                </div>
              )}
              {subTotal > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>Subtotal</span>
                  <span className='text-sm text-gray-700'>{DisplayPriceInRupees(subTotal)}</span>
                </div>
              )}
              <div className='flex items-center justify-between border-t border-dashed border-gray-200 pt-2'>
                <span className='text-xs font-bold text-gray-700'>Order Total Paid</span>
                <span className='text-base font-bold text-gray-800'>{DisplayPriceInRupees(orderTotal)}</span>
              </div>
              {ret.refundAmount > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-1.5 text-xs font-bold text-green-700'>
                    <FaWallet size={11} /> Refund Amount
                  </span>
                  <span className='text-sm font-bold text-green-700'>{DisplayPriceInRupees(ret.refundAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {addr && (
            <div className='border border-gray-100 rounded-2xl overflow-hidden'>
              <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
                <FaMapMarkerAlt className='text-gray-400' size={12} />
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Delivery Address</p>
              </div>
              <div className='px-4 py-3'>
                <p className='text-sm font-semibold text-gray-800'>{addr.name}</p>
                {addr.mobile && <p className='text-xs text-gray-500'>{addr.mobile}</p>}
                <p className='text-xs text-gray-600 mt-1 leading-relaxed'>
                  {[addr.address_line, addr.city, addr.state, addr.pincode, addr.country]
                    .filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Order Status */}
          {order?.orderStatus && (
            <div className='flex items-center justify-between text-xs text-gray-500 px-1'>
              <span>Order Status</span>
              <span className='font-semibold text-gray-700'>{order.orderStatus}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const MyReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true)
        const res = await Axios({ ...SummaryApi.getMyReturns })
        if (res.data.success) setReturns(res.data.data)
      } catch (e) {
        toast.error('Failed to load returns')
      } finally {
        setLoading(false)
      }
    }
    fetchReturns()
  }, [])

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* Header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='p-4 max-w-3xl mx-auto flex items-center gap-3'>
          <div className='w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center'>
            <FaUndoAlt className='text-orange-600' size={16} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>My Returns</h1>
            <p className='text-xs text-gray-500'>{returns.length} return request{returns.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className='max-w-3xl mx-auto p-4'>

        {loading && (
          <div className='flex justify-center py-16'>
            <div className='w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin'></div>
          </div>
        )}

        {!loading && returns.length === 0 && (
          <div className='mt-8'>
            <NoData />
            <div className='text-center mt-4'>
              <p className='text-gray-500 text-sm mb-3'>No return requests yet</p>
              <button
                onClick={() => navigate('/dashboard/myorders')}
                className='bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold'
              >
                View My Orders
              </button>
            </div>
          </div>
        )}

        <div className='space-y-3'>
          {returns.map(ret => {
            const preview = ret.items?.[0]?.product_details?.image?.[0]
            const firstName = ret.items?.[0]?.product_details?.name || 'Item'
            const isCOD = (ret.paymentMethod?.toUpperCase() === 'COD') ||
              (typeof ret.orderId === 'object' && ret.orderId?.payment_status?.toUpperCase() === 'CASH ON DELIVERY')

            return (
              <div
                key={ret._id}
                onClick={() => setSelected(ret)}
                className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer overflow-hidden'
              >
                <div className='p-4'>
                  <div className='flex items-start gap-3'>
                    {preview ? (
                      <div className='w-16 h-16 rounded-xl border bg-gray-50 p-1 flex-shrink-0'>
                        <img src={preview} className='w-full h-full object-contain' alt='' />
                      </div>
                    ) : (
                      <div className='w-16 h-16 rounded-xl border bg-gray-100 flex items-center justify-center flex-shrink-0'>
                        <FaBoxOpen className='text-gray-300' size={22} />
                      </div>
                    )}

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='font-semibold text-gray-800 text-sm line-clamp-1'>
                          {ret.items?.length === 1 ? firstName : `${firstName} + ${ret.items.length - 1} more`}
                        </p>
                        <FaChevronRight className='text-gray-300 flex-shrink-0 mt-0.5' size={11} />
                      </div>
                      <p className='text-[11px] text-gray-400 mt-0.5'>Order #{ret.orderDisplayId}</p>
                      <p className='text-xs text-gray-500 mt-0.5 italic line-clamp-1'>"{ret.reason}"</p>

                      <div className='flex flex-wrap items-center gap-2 mt-2'>
                        <StatusBadge status={ret.status} />
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCOD ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                          {isCOD ? '💵 COD' : '💳 Online'}
                        </span>
                        <span className='text-[11px] text-gray-400'>{formatDate(ret.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick summary strip */}
                  <div className='flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-100'>
                    <div className='flex items-center gap-1 text-xs text-gray-500'>
                      <FaReceipt size={10} />
                      <span>Order Total: <span className='font-semibold text-gray-700'>
                        {DisplayPriceInRupees(typeof ret.orderId === 'object' ? (ret.orderId?.totalAmt || ret.totalAmt) : ret.totalAmt)}
                      </span></span>
                    </div>
                    {ret.refundAmount > 0 && (
                      <div className='flex items-center gap-1 text-xs text-green-700 font-semibold'>
                        <FaWallet size={10} />
                        Refund: {DisplayPriceInRupees(ret.refundAmount)}
                      </div>
                    )}
                    <span className='text-[11px] text-primary font-semibold'>View Details →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <DetailModal ret={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export default MyReturns
