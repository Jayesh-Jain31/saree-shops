import React, { useEffect, useState, useMemo } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import {
  FaBoxOpen, FaSearch, FaChevronLeft, FaChevronRight,
  FaFilter, FaCheckCircle, FaMoneyBillWave, FaCreditCard,
  FaTruck, FaTimes, FaChevronDown, FaChevronUp, FaUser
} from 'react-icons/fa'
import { MdAccessTime, MdDone, MdInventory, MdPending, MdEdit, MdSave, MdClose } from 'react-icons/md'

const statusOptions = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

const statusConfig = {
  'Pending':         { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  icon: <MdPending size={12} /> },
  'Confirmed':       { color: 'bg-blue-50 text-blue-700 border-blue-200',         icon: <FaCheckCircle size={10} /> },
  'Shipped':         { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',   icon: <MdInventory size={12} /> },
  'Out for Delivery':{ color: 'bg-purple-50 text-purple-700 border-purple-200',   icon: <FaTruck size={11} /> },
  'Delivered':       { color: 'bg-emerald-50 text-emerald-700 border-emerald-200',icon: <MdDone size={13} /> },
  'Cancelled':       { color: 'bg-red-50 text-red-700 border-red-200',            icon: <FaTimes size={10} /> },
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMin = Math.floor((now - d) / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateStr)
}

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Pending']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      {cfg.icon} {status || 'Pending'}
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
      <FaCreditCard size={10} /> Online Paid
    </span>
  )
}

const OrderCard = ({ order, onStatusUpdate }) => {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newStatus, setNewStatus] = useState(order.orderStatus)
  const [saving, setSaving] = useState(false)

  const items = order?.items || []
  const previewImages = items.slice(0, 4).map(i => i.product_details?.image?.[0]).filter(Boolean)
  const firstName = items[0]?.product_details?.name || 'Order'
  const totalItems = items.reduce((s, i) => s + (i.quantity || 1), 0)

  const handleSave = async () => {
    setSaving(true)
    await onStatusUpdate(order._id, newStatus)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all'>
      {/* Card Header — clickable to expand */}
      <div className='p-4 cursor-pointer' onClick={() => setExpanded(e => !e)}>
        <div className='flex items-start gap-3'>
          {/* Product image grid */}
          <div className='flex-shrink-0'>
            {previewImages.length === 0 && (
              <div className='w-20 h-20 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center'>
                <FaBoxOpen className='text-gray-300' size={24} />
              </div>
            )}
            {previewImages.length === 1 && (
              <div className='w-20 h-20 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden p-1'>
                <img src={previewImages[0]} alt='' className='w-full h-full object-contain' />
              </div>
            )}
            {previewImages.length >= 2 && (
              <div className='w-20 h-20 grid grid-cols-2 gap-0.5 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden p-0.5'>
                {previewImages.slice(0, 4).map((img, i) => (
                  <div key={i} className='bg-white rounded overflow-hidden flex items-center justify-center'>
                    <img src={img} alt='' className='w-full h-full object-contain p-0.5' />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='font-semibold text-gray-800 text-sm leading-snug line-clamp-1'>
                  {items.length === 1
                    ? firstName
                    : `${firstName} + ${items.length - 1} more item${items.length - 1 > 1 ? 's' : ''}`}
                </p>
                <p className='text-[11px] font-mono text-gray-400 mt-0.5'>{order.orderId}</p>
              </div>
              {expanded ? <FaChevronUp className='text-gray-400 flex-shrink-0 mt-1' size={12} /> : <FaChevronDown className='text-gray-400 flex-shrink-0 mt-1' size={12} />}
            </div>

            {/* Customer */}
            <div className='flex items-center gap-1 text-[11px] text-gray-500 mt-1'>
              <FaUser size={9} />
              <span className='font-medium'>{order.userId?.name || 'Unknown'}</span>
              {order.userId?.email && <span className='text-gray-400'>· {order.userId.email}</span>}
            </div>

            <div className='flex items-center gap-1.5 text-[11px] text-gray-400 mt-1'>
              <MdAccessTime size={12} />
              <span>{formatRelative(order.createdAt)}</span>
              <span className='text-gray-200'>·</span>
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>

            <div className='flex flex-wrap items-center gap-1.5 mt-2'>
              <StatusBadge status={order.orderStatus} />
              <PaymentBadge status={order.payment_status} />
            </div>

            <p className='text-base font-bold text-gray-800 mt-2'>{DisplayPriceInRupees(order.totalAmt)}</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className='border-t border-gray-100 px-4 pb-4 pt-3'>
          {/* Product list */}
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2'>Items Ordered</p>
          <div className='space-y-2 mb-3'>
            {items.map((item, idx) => (
              <div key={idx} className='flex items-center gap-2 bg-gray-50 rounded-lg p-2'>
                {item.product_details?.image?.[0] && (
                  <img src={item.product_details.image[0]} alt='' className='w-10 h-10 object-contain rounded bg-white border border-gray-100 p-0.5 flex-shrink-0' />
                )}
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-medium text-gray-700 line-clamp-1'>{item.product_details?.name}</p>
                  <p className='text-[10px] text-gray-400'>Qty: {item.quantity}</p>
                </div>
                <p className='text-xs font-semibold text-gray-700 flex-shrink-0'>{DisplayPriceInRupees(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className='bg-blue-50 rounded-lg p-2.5 mb-3'>
              <p className='text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1'>Delivery Address</p>
              <p className='text-xs text-gray-600'>
                {order.delivery_address.address_line && `${order.delivery_address.address_line}, `}
                {order.delivery_address.city && `${order.delivery_address.city}, `}
                {order.delivery_address.state && `${order.delivery_address.state} `}
                {order.delivery_address.pincode}
              </p>
              {order.delivery_address.mobile && (
                <p className='text-[10px] text-gray-400 mt-0.5'>📞 {order.delivery_address.mobile}</p>
              )}
            </div>
          )}

          {/* Status Update */}
          <div className='flex items-center justify-between'>
            <div className='text-xs text-gray-400'>Ordered on {formatDate(order.createdAt)}</div>
            {editing ? (
              <div className='flex items-center gap-2'>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className='text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-green-500'
                  onClick={e => e.stopPropagation()}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={e => { e.stopPropagation(); handleSave() }}
                  disabled={saving}
                  className='flex items-center gap-1 text-[11px] bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50'
                >
                  <MdSave size={12} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setEditing(false); setNewStatus(order.orderStatus) }}
                  className='flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200'
                >
                  <MdClose size={12} /> Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditing(true) }}
                className='flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:border-green-500 hover:text-green-600 transition-colors'
              >
                <MdEdit size={13} /> Change Status
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchOrders = async (p = page, s = filterStatus, q = search) => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getAllOrdersAdmin,
        data: { page: p, status: s, search: q, limit: 12 }
      })
      if (response.data.success) {
        setOrders(response.data.data.orders)
        setTotalPages(response.data.data.totalPages)
        setTotalCount(response.data.data.totalCount)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(page, filterStatus, search)
  }, [page, filterStatus])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
    fetchOrders(1, filterStatus, searchInput)
  }

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateOrderStatusAdmin,
        data: { orderId, status }
      })
      if (response.data.success) {
        toast.success('Order status updated')
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o))
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.orderStatus === 'Pending').length
    const active = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)).length
    const revenue = orders.reduce((s, o) => s + (o.totalAmt || 0), 0)
    return { pending, active, revenue }
  }, [orders])

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sticky header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
              <FaBoxOpen className='text-blue-600' size={18} />
            </div>
            <div>
              <h1 className='font-bold text-xl text-gray-800'>Manage Orders</h1>
              <p className='text-xs text-gray-500'>{totalCount} total order{totalCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-2 mb-4'>
            <div className='bg-orange-50 rounded-xl p-2.5 text-center'>
              <p className='text-[9px] text-orange-400 uppercase tracking-wider font-bold'>Pending</p>
              <p className='text-lg font-bold text-orange-700'>{stats.pending}</p>
            </div>
            <div className='bg-blue-50 rounded-xl p-2.5 text-center'>
              <p className='text-[9px] text-blue-400 uppercase tracking-wider font-bold'>Active</p>
              <p className='text-lg font-bold text-blue-700'>{stats.active}</p>
            </div>
            <div className='bg-purple-50 rounded-xl p-2.5 text-center'>
              <p className='text-[9px] text-purple-400 uppercase tracking-wider font-bold'>Page Revenue</p>
              <p className='text-sm font-bold text-purple-700 truncate'>{DisplayPriceInRupees(stats.revenue)}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className='flex flex-col sm:flex-row gap-2'>
            <form onSubmit={handleSearch} className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
              <input
                type='text'
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder='Search by Order ID or customer name…'
                className='w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500 bg-gray-50'
              />
            </form>
            <div className='relative'>
              <FaFilter className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400' size={10} />
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                className='pl-7 pr-4 py-2 border rounded-lg text-xs bg-gray-50 cursor-pointer focus:outline-none focus:border-green-500 appearance-none'
              >
                <option value='all'>All Status</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className='max-w-4xl mx-auto p-4'>
        {loading ? (
          <div className='space-y-3'>
            {[1,2,3].map(i => (
              <div key={i} className='bg-white rounded-xl border border-gray-100 p-4 animate-pulse'>
                <div className='flex gap-3'>
                  <div className='w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-100 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-100 rounded w-1/2'></div>
                    <div className='h-3 bg-gray-100 rounded w-1/3'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <FaBoxOpen size={40} className='mb-3' />
            <p className='font-medium text-sm'>No orders found</p>
            <p className='text-xs mt-1'>Try a different filter or search</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {orders.map(order => (
              <OrderCard key={order._id} order={order} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-xs text-gray-500'>Page {page} of {totalPages}</p>
            <div className='flex gap-1'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'
              >
                <FaChevronLeft size={10} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded border text-xs font-medium ${pg === page ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50'}`}
                  >
                    {pg}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders
