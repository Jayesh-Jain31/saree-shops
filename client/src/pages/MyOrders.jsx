import React, { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import NoData from '../components/NoData'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
  FaBoxOpen, FaCheckCircle, FaTruck, FaMoneyBillWave, FaCreditCard,
  FaChevronDown, FaChevronUp, FaSearch, FaFilter, FaReceipt,
  FaShoppingBag, FaRegCalendarAlt
} from 'react-icons/fa'
import { MdAccessTime, MdLocationOn, MdDeliveryDining, MdDone, MdInventory } from 'react-icons/md'

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

const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateStr)
}

const PaymentBadge = ({ status }) => {
  if (!status) return null
  const s = status.toUpperCase()
  if (s === 'CASH ON DELIVERY') return (
    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
      <FaMoneyBillWave size={10} /> COD
    </span>
  )
  if (s === 'PAID') return (
    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
      <FaCheckCircle size={10} /> Paid
    </span>
  )
  return (
    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200'>
      <FaCreditCard size={10} /> {status}
    </span>
  )
}

const OrderTimeline = ({ createdAt }) => {
  const steps = [
    { label: 'Order Placed', icon: <FaShoppingBag size={12} />, done: true },
    { label: 'Confirmed', icon: <FaCheckCircle size={12} />, done: true },
    { label: 'Shipped', icon: <MdInventory size={14} />, done: false },
    { label: 'Delivered', icon: <MdDeliveryDining size={14} />, done: false },
  ]

  return (
    <div className='flex items-center gap-0 w-full mt-3'>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className='flex flex-col items-center'>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white
              ${step.done ? 'bg-green-500' : 'bg-gray-300'}`}>
              {step.done ? <MdDone size={14} /> : step.icon}
            </div>
            <span className={`text-[10px] mt-1 text-center leading-tight
              ${step.done ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${step.done && steps[i + 1]?.done ? 'bg-green-400' : step.done ? 'bg-gradient-to-r from-green-400 to-gray-300' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden'>
      {/* Top bar */}
      <div className='px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-50 to-gray-50 border-b'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
            <FaReceipt className='text-green-600' size={14} />
          </div>
          <div>
            <p className='text-xs font-mono font-bold text-gray-700 tracking-wide'>{order?.orderId}</p>
            <p className='text-[10px] text-gray-400'>{formatRelative(order?.createdAt)}</p>
          </div>
        </div>
        <PaymentBadge status={order?.payment_status} />
      </div>

      {/* Product section */}
      <div className='p-4'>
        <div className='flex gap-4'>
          <div className='flex-shrink-0 w-24 h-24 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden p-1'>
            <img
              src={order.product_details?.image?.[0]}
              alt={order.product_details?.name}
              className='w-full h-full object-contain'
            />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-1'>
              {order.product_details?.name}
            </p>

            <div className='flex items-center gap-1.5 text-xs text-gray-400 mb-2'>
              <FaRegCalendarAlt size={11} />
              <span>{formatDate(order.createdAt)}</span>
              <span className='text-gray-300'>|</span>
              <MdAccessTime size={13} />
              <span>{formatTime(order.createdAt)}</span>
            </div>

            <div className='flex flex-wrap gap-2'>
              <div className='bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5'>
                <p className='text-[10px] text-gray-400 uppercase tracking-wide'>Subtotal</p>
                <p className='text-sm font-semibold text-gray-700'>{DisplayPriceInRupees(order?.subTotalAmt)}</p>
              </div>
              <div className='bg-green-50 border border-green-100 rounded-lg px-3 py-1.5'>
                <p className='text-[10px] text-green-500 uppercase tracking-wide'>Total</p>
                <p className='text-sm font-bold text-green-700'>{DisplayPriceInRupees(order?.totalAmt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <OrderTimeline createdAt={order?.createdAt} />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className='w-full py-2.5 text-xs font-medium text-gray-500 hover:text-green-600 hover:bg-green-50 flex items-center justify-center gap-1 border-t transition-colors'
      >
        {expanded ? (
          <>Less Details <FaChevronUp size={10} /></>
        ) : (
          <>More Details <FaChevronDown size={10} /></>
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className='px-4 pb-4 space-y-3 border-t bg-gray-50'>
          {/* Delivery Address */}
          {order?.delivery_address && (
            <div className='bg-white rounded-xl p-3 flex items-start gap-2.5 mt-3 border'>
              <MdLocationOn className='text-red-400 mt-0.5 flex-shrink-0' size={18} />
              <div className='text-xs text-gray-600 leading-relaxed'>
                <p className='font-semibold text-gray-700 text-sm mb-1'>Delivery Address</p>
                <p>{order.delivery_address?.address_line}</p>
                <p>{[order.delivery_address?.city, order.delivery_address?.state].filter(Boolean).join(', ')}</p>
                <p>{[order.delivery_address?.country, order.delivery_address?.pincode].filter(Boolean).join(' - ')}</p>
                {order.delivery_address?.mobile && (
                  <p className='mt-1.5 font-medium text-gray-700'>Phone: {order.delivery_address.mobile}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className='bg-white rounded-xl p-3 border'>
            <p className='font-semibold text-gray-700 text-sm mb-2'>Payment Details</p>
            <div className='grid grid-cols-2 gap-y-2 text-xs'>
              <p className='text-gray-400'>Method</p>
              <p className='text-gray-700 font-medium'>{order?.payment_status || 'N/A'}</p>
              {order?.paymentId && order.paymentId !== "" && (
                <>
                  <p className='text-gray-400'>Transaction ID</p>
                  <p className='text-gray-700 font-mono text-[11px] break-all'>{order.paymentId}</p>
                </>
              )}
              <p className='text-gray-400'>Subtotal</p>
              <p className='text-gray-700'>{DisplayPriceInRupees(order?.subTotalAmt)}</p>
              <p className='text-gray-400'>Delivery</p>
              <p className='text-green-600 font-medium'>Free</p>
              <p className='text-gray-400 font-semibold'>Total Paid</p>
              <p className='text-green-700 font-bold'>{DisplayPriceInRupees(order?.totalAmt)}</p>
            </div>
          </div>

          {/* Product Images Gallery */}
          {order.product_details?.image?.length > 1 && (
            <div className='bg-white rounded-xl p-3 border'>
              <p className='font-semibold text-gray-700 text-sm mb-2'>Product Images</p>
              <div className='flex gap-2 overflow-x-auto pb-1'>
                {order.product_details.image.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Product ${i + 1}`}
                    className='w-16 h-16 object-contain rounded-lg border bg-gray-50 flex-shrink-0 p-0.5'
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MyOrders = () => {
  const orders = useSelector(state => state.orders.order)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' ||
        order?.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.product_details?.name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'paid' && order?.payment_status?.toUpperCase() === 'PAID') ||
        (filterStatus === 'cod' && order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY')

      return matchesSearch && matchesFilter
    })
  }, [orders, searchQuery, filterStatus])

  const orderStats = useMemo(() => {
    const total = orders.length
    const paid = orders.filter(o => o?.payment_status?.toUpperCase() === 'PAID').length
    const cod = orders.filter(o => o?.payment_status?.toUpperCase() === 'CASH ON DELIVERY').length
    const totalSpent = orders.reduce((sum, o) => sum + (o?.totalAmt || 0), 0)
    return { total, paid, cod, totalSpent }
  }, [orders])

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='bg-white border-b p-4'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
            <FaBoxOpen className='text-green-600' size={20} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>My Orders</h1>
            <p className='text-xs text-gray-500'>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>

        {/* Stats Cards */}
        {orders.length > 0 && (
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4'>
            <div className='bg-blue-50 border border-blue-100 rounded-xl p-3'>
              <p className='text-[10px] text-blue-400 uppercase tracking-wide font-semibold'>Total Orders</p>
              <p className='text-xl font-bold text-blue-700'>{orderStats.total}</p>
            </div>
            <div className='bg-green-50 border border-green-100 rounded-xl p-3'>
              <p className='text-[10px] text-green-400 uppercase tracking-wide font-semibold'>Online Paid</p>
              <p className='text-xl font-bold text-green-700'>{orderStats.paid}</p>
            </div>
            <div className='bg-amber-50 border border-amber-100 rounded-xl p-3'>
              <p className='text-[10px] text-amber-400 uppercase tracking-wide font-semibold'>COD Orders</p>
              <p className='text-xl font-bold text-amber-700'>{orderStats.cod}</p>
            </div>
            <div className='bg-purple-50 border border-purple-100 rounded-xl p-3'>
              <p className='text-[10px] text-purple-400 uppercase tracking-wide font-semibold'>Total Spent</p>
              <p className='text-lg font-bold text-purple-700'>{DisplayPriceInRupees(orderStats.totalSpent)}</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        {orders.length > 0 && (
          <div className='flex flex-col sm:flex-row gap-2'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={13} />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search by order ID or product name...'
                className='w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-green-500 bg-gray-50'
              />
            </div>
            <div className='relative'>
              <FaFilter className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={11} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='pl-8 pr-6 py-2 border rounded-xl text-sm focus:outline-none focus:border-green-500 bg-gray-50 appearance-none cursor-pointer'
              >
                <option value='all'>All Orders</option>
                <option value='paid'>Paid Online</option>
                <option value='cod'>Cash on Delivery</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!orders[0] && <NoData />}

      {/* Filtered empty */}
      {orders.length > 0 && filteredOrders.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
          <FaSearch size={32} className='mb-3' />
          <p className='font-medium'>No orders found</p>
          <p className='text-sm'>Try adjusting your search or filter</p>
        </div>
      )}

      {/* Orders List */}
      <div className='p-4 space-y-4 max-w-3xl mx-auto'>
        {filteredOrders.map((order, index) => (
          <OrderCard key={order._id + index} order={order} />
        ))}
      </div>
    </div>
  )
}

export default MyOrders
