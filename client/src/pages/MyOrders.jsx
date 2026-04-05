import React, { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import NoData from '../components/NoData'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
  FaBoxOpen, FaCheckCircle, FaMoneyBillWave, FaCreditCard,
  FaSearch, FaFilter, FaChevronRight, FaTimes, FaTruck
} from 'react-icons/fa'
import { MdAccessTime, MdDeliveryDining, MdDone, MdInventory, MdPending } from 'react-icons/md'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
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

const statusConfig = {
  'Pending': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <MdPending size={12} /> },
  'Confirmed': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FaCheckCircle size={10} /> },
  'Shipped': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <MdInventory size={12} /> },
  'Out for Delivery': { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FaTruck size={11} /> },
  'Delivered': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <MdDone size={13} /> },
  'Cancelled': { color: 'bg-red-50 text-red-700 border-red-200', icon: <FaTimes size={10} /> },
}

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig['Pending']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.color}`}>
      {config.icon} {status || 'Pending'}
    </span>
  )
}

const PaymentBadge = ({ status }) => {
  if (!status) return null
  const s = status.toUpperCase()
  if (s === 'CASH ON DELIVERY') return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
      <FaMoneyBillWave size={10} /> COD
    </span>
  )
  return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200'>
      <FaCreditCard size={10} /> Paid
    </span>
  )
}

const OrderCard = ({ order, onClick }) => {
  const items = order?.items || []
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const previewImages = items.slice(0, 4).map(item => item.product_details?.image?.[0]).filter(Boolean)
  const firstName = items[0]?.product_details?.name || 'Order'

  return (
    <div
      onClick={onClick}
      className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer group'
    >
      <div className='p-4'>
        <div className='flex items-start gap-3'>
          {/* Product Images Preview */}
          <div className='flex-shrink-0'>
            {previewImages.length === 1 && (
              <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden p-1'>
                <img src={previewImages[0]} alt='' className='w-full h-full object-contain' />
              </div>
            )}
            {previewImages.length >= 2 && (
              <div className='w-20 h-20 sm:w-24 sm:h-24 grid grid-cols-2 gap-0.5 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden p-0.5'>
                {previewImages.slice(0, 4).map((img, i) => (
                  <div key={i} className='bg-white rounded overflow-hidden flex items-center justify-center'>
                    <img src={img} alt='' className='w-full h-full object-contain p-0.5' />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='font-semibold text-gray-800 text-sm leading-snug line-clamp-1'>
                  {items.length === 1
                    ? firstName
                    : `${firstName} + ${items.length - 1} more item${items.length - 1 > 1 ? 's' : ''}`
                  }
                </p>
                <p className='text-[11px] font-mono text-gray-400 mt-0.5'>{order?.orderId}</p>
              </div>
              <FaChevronRight className='text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0 mt-1' size={12} />
            </div>

            <div className='flex items-center gap-1.5 text-[11px] text-gray-400 mt-1'>
              <MdAccessTime size={12} />
              <span>{formatRelative(order.createdAt)}</span>
              <span className='text-gray-200'>·</span>
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>

            <div className='flex flex-wrap items-center gap-1.5 mt-2'>
              <StatusBadge status={order?.orderStatus} />
              <PaymentBadge status={order?.payment_status} />
            </div>

            <p className='text-base font-bold text-gray-800 mt-2'>
              {DisplayPriceInRupees(order?.totalAmt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const MyOrders = () => {
  const orders = useSelector(state => state.orders.order)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' ||
        order?.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.items?.some(item =>
          item?.product_details?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesStatus = filterStatus === 'all' ||
        order?.orderStatus === filterStatus

      const matchesPayment = filterPayment === 'all' ||
        (filterPayment === 'paid' && order?.payment_status?.toUpperCase() === 'PAID') ||
        (filterPayment === 'cod' && order?.payment_status?.toUpperCase() === 'CASH ON DELIVERY')

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, searchQuery, filterStatus, filterPayment])

  const orderStats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter(o => o?.orderStatus === 'Delivered').length
    const active = orders.filter(o => !['Delivered', 'Cancelled'].includes(o?.orderStatus)).length
    const totalSpent = orders.reduce((sum, o) => sum + (o?.totalAmt || 0), 0)
    return { total, delivered, active, totalSpent }
  }, [orders])

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='p-4 max-w-3xl mx-auto'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
              <FaBoxOpen className='text-green-600' size={18} />
            </div>
            <div>
              <h1 className='font-bold text-xl text-gray-800'>My Orders</h1>
              <p className='text-xs text-gray-500'>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
            </div>
          </div>

          {/* Stats */}
          {orders.length > 0 && (
            <div className='grid grid-cols-4 gap-2 mb-4'>
              <div className='bg-blue-50 rounded-xl p-2.5 text-center'>
                <p className='text-[9px] text-blue-400 uppercase tracking-wider font-bold'>Total</p>
                <p className='text-lg font-bold text-blue-700'>{orderStats.total}</p>
              </div>
              <div className='bg-orange-50 rounded-xl p-2.5 text-center'>
                <p className='text-[9px] text-orange-400 uppercase tracking-wider font-bold'>Active</p>
                <p className='text-lg font-bold text-orange-700'>{orderStats.active}</p>
              </div>
              <div className='bg-emerald-50 rounded-xl p-2.5 text-center'>
                <p className='text-[9px] text-emerald-400 uppercase tracking-wider font-bold'>Delivered</p>
                <p className='text-lg font-bold text-emerald-700'>{orderStats.delivered}</p>
              </div>
              <div className='bg-purple-50 rounded-xl p-2.5 text-center'>
                <p className='text-[9px] text-purple-400 uppercase tracking-wider font-bold'>Spent</p>
                <p className='text-sm font-bold text-purple-700 truncate'>{DisplayPriceInRupees(orderStats.totalSpent)}</p>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          {orders.length > 0 && (
            <div className='flex flex-col sm:flex-row gap-2'>
              <div className='relative flex-1'>
                <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search orders...'
                  className='w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 bg-gray-50'
                />
              </div>
              <div className='flex gap-2'>
                <div className='relative'>
                  <FaFilter className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400' size={10} />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className='pl-7 pr-4 py-2 border rounded-lg text-xs focus:outline-none focus:border-green-500 bg-gray-50 appearance-none cursor-pointer'
                  >
                    <option value='all'>All Status</option>
                    <option value='Pending'>Pending</option>
                    <option value='Confirmed'>Confirmed</option>
                    <option value='Shipped'>Shipped</option>
                    <option value='Out for Delivery'>Out for Delivery</option>
                    <option value='Delivered'>Delivered</option>
                    <option value='Cancelled'>Cancelled</option>
                  </select>
                </div>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className='px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-green-500 bg-gray-50 appearance-none cursor-pointer'
                >
                  <option value='all'>All Payment</option>
                  <option value='paid'>Online Paid</option>
                  <option value='cod'>COD</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='max-w-3xl mx-auto p-4'>
        {!orders.length && (
          <div className='mt-8'>
            <NoData />
            <div className='text-center mt-4'>
              <p className='text-gray-500 text-sm mb-3'>You haven't placed any orders yet</p>
              <button
                onClick={() => navigate('/')}
                className='bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors'
              >
                Start Shopping
              </button>
            </div>
          </div>
        )}

        {orders.length > 0 && filteredOrders.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
            <FaSearch size={28} className='mb-3' />
            <p className='font-medium text-sm'>No matching orders</p>
            <p className='text-xs mt-1'>Try a different search or filter</p>
          </div>
        )}

        <div className='space-y-3'>
          {filteredOrders.map((order, index) => (
            <OrderCard
              key={order._id + index}
              order={order}
              onClick={() => navigate(`/dashboard/order/${order._id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyOrders
