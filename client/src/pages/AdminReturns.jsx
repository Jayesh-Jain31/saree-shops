import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import BackButton from '../components/BackButton'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import {
  FaUndoAlt, FaSearch, FaTimes, FaUser, FaMapMarkerAlt,
  FaCreditCard, FaShoppingBag, FaTruck, FaBox, FaChevronRight,
  FaMoneyBillWave, FaWallet, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa'
import { MdDone, MdClose, MdPending, MdLocalAtm } from 'react-icons/md'

const STATUS_OPTIONS = ['Pending', 'Approved', 'Pick Up Scheduled', 'Refund Initiated', 'Refunded', 'Rejected']

const STATUS_META = {
  'Pending':           { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400', icon: <MdPending size={12} />, emoji: '⏳' },
  'Approved':          { color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   icon: <MdDone size={12} />,    emoji: '✅' },
  'Pick Up Scheduled': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400', icon: <FaTruck size={11} />,   emoji: '🚚' },
  'Refund Initiated':  { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-400', icon: <MdLocalAtm size={12} />, emoji: '💳' },
  'Refunded':          { color: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-400',  icon: <MdDone size={12} />,    emoji: '💰' },
  'Rejected':          { color: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-400',    icon: <MdClose size={12} />,   emoji: '❌' },
}

const StatusBadge = ({ status, size = 'sm' }) => {
  const m = STATUS_META[status] || STATUS_META['Pending']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${size === 'sm' ? 'text-[11px]' : 'text-xs'} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} flex-shrink-0`}></span>
      {status}
    </span>
  )
}

const FLOW_STEPS = ['Pending', 'Approved', 'Pick Up Scheduled', 'Refund Initiated', 'Refunded']

const DetailDrawer = ({ ret, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    status: ret.status,
    adminNote: ret.adminNote || '',
    refundAmount: ret.refundAmount || ret.totalAmt || '',
  })
  const [saving, setSaving] = useState(false)

  const isCOD = ret.paymentMethod?.toUpperCase() === 'COD'
  const isRejected = ret.status === REJECTED_STATUS
  const currentStepIdx = FLOW_STEPS.indexOf(ret.status)

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await Axios({
        ...SummaryApi.updateReturnStatus,
        url: `${SummaryApi.updateReturnStatus.url}/${ret._id}`,
        data: {
          status: form.status,
          adminNote: form.adminNote,
          refundAmount: parseFloat(form.refundAmount) || 0,
        },
      })
      if (res.data.success) {
        toast.success(res.data.message || 'Return updated')
        onUpdated(res.data.data)
        onClose()
      }
    } catch {
      toast.error('Failed to update return')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const isFreeShipping = false

  return (
    <div className='fixed inset-0 z-50 flex'>
      <div className='flex-1 bg-black/50' onClick={onClose} />
      <div className='w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col'>

        {/* Header */}
        <div className='sticky top-0 bg-white z-10 border-b px-4 py-3 flex items-center justify-between'>
          <div>
            <p className='font-bold text-gray-800'>Return #{ret.orderDisplayId}</p>
            <p className='text-[11px] text-gray-500'>{formatDate(ret.createdAt)}</p>
          </div>
          <button onClick={onClose} className='w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600'>
            <FaTimes size={13} />
          </button>
        </div>

        <div className='p-4 space-y-4 flex-1'>

          {/* Current Status + Flow */}
          <div className='bg-gray-50 rounded-2xl p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-[11px] font-bold text-gray-400 uppercase tracking-wide'>Current Status</p>
              <StatusBadge status={ret.status} />
            </div>
            {ret.status !== 'Rejected' && (
              <div className='flex items-center gap-0 pt-1'>
                {FLOW_STEPS.map((step, i) => {
                  const done = i <= currentStepIdx
                  const active = i === currentStepIdx
                  return (
                    <React.Fragment key={step}>
                      <div className='flex flex-col items-center'>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                          done ? active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {done && !active ? <MdDone size={12} /> : i + 1}
                        </div>
                        <p className={`text-[8px] mt-0.5 text-center w-12 leading-tight ${done ? active ? 'text-orange-600 font-bold' : 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                          {step}
                        </p>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-3.5 ${i < currentStepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}
            {ret.status === 'Rejected' && (
              <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2'>
                <FaTimesCircle className='text-red-500' size={14} />
                <p className='text-xs font-semibold text-red-700'>Return request was rejected</p>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
              <FaUser className='text-gray-400' size={11} />
              <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide'>Customer</p>
            </div>
            <div className='px-4 py-3 space-y-1'>
              <p className='text-sm font-semibold text-gray-800'>{ret.userId?.name || '—'}</p>
              <p className='text-xs text-gray-500'>{ret.userId?.email}</p>
              {ret.userId?.mobile && <p className='text-xs text-gray-500'>{ret.userId.mobile}</p>}
            </div>
          </div>

          {/* Items */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
              <FaShoppingBag className='text-gray-400' size={11} />
              <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide'>Items ({ret.items?.length})</p>
            </div>
            <div className='divide-y divide-gray-50'>
              {ret.items?.map((item, i) => (
                <div key={i} className='flex items-center gap-3 px-4 py-3'>
                  <div className='w-12 h-12 rounded-xl border bg-gray-50 p-1 flex-shrink-0'>
                    <img
                      src={item.product_details?.image?.[0]}
                      alt=''
                      className='w-full h-full object-contain'
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs font-semibold text-gray-800 line-clamp-2 leading-snug'>{item.product_details?.name}</p>
                    <p className='text-[11px] text-gray-400'>Qty: {item.quantity}</p>
                  </div>
                  {item.price > 0 && (
                    <p className='text-sm font-bold text-gray-700 flex-shrink-0'>{DisplayPriceInRupees(item.price * item.quantity)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Return Reason */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b'>
              <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide'>Return Reason</p>
            </div>
            <div className='px-4 py-3 space-y-1'>
              <p className='text-sm font-semibold text-gray-800'>{ret.reason}</p>
              {ret.description && <p className='text-xs text-gray-500 italic'>"{ret.description}"</p>}
            </div>
          </div>

          {/* Payment */}
          <div className='border border-gray-100 rounded-2xl overflow-hidden'>
            <div className='bg-gray-50 px-4 py-2 border-b flex items-center gap-2'>
              <FaCreditCard className='text-gray-400' size={11} />
              <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide'>Payment</p>
            </div>
            <div className='px-4 py-3 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-xs text-gray-500'>Method</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${isCOD ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                  {isCOD ? <FaMoneyBillWave size={10} /> : <FaCreditCard size={10} />}
                  {isCOD ? 'Cash on Delivery' : 'Online'}
                </span>
              </div>
              {ret.paymentId && !isCOD && (
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-gray-500'>Payment ID</span>
                  <span className='text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded'>{ret.paymentId}</span>
                </div>
              )}
              <div className='flex justify-between items-center border-t border-dashed border-gray-100 pt-2'>
                <span className='text-xs font-bold text-gray-700'>Order Total</span>
                <span className='text-sm font-bold text-gray-800'>{DisplayPriceInRupees(ret.totalAmt)}</span>
              </div>
              {ret.refundAmount > 0 && (
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-bold text-green-700 flex items-center gap-1'><FaWallet size={10} /> Refunded</span>
                  <span className='text-sm font-bold text-green-700'>{DisplayPriceInRupees(ret.refundAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Update Form ── */}
          <div className='border-2 border-orange-100 rounded-2xl overflow-hidden'>
            <div className='bg-orange-50 px-4 py-2.5 border-b border-orange-100'>
              <p className='text-xs font-bold text-orange-700 uppercase tracking-wide'>Update Return</p>
            </div>
            <div className='px-4 py-4 space-y-3'>

              {/* Status grid selector */}
              <div>
                <label className='block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2'>Set Status</label>
                <div className='grid grid-cols-2 gap-1.5'>
                  {STATUS_OPTIONS.map(s => {
                    const m = STATUS_META[s]
                    return (
                      <button
                        key={s}
                        type='button'
                        onClick={() => setForm(p => ({ ...p, status: s }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                          form.status === s
                            ? `border-orange-400 bg-orange-50 text-orange-700`
                            : `border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200`
                        }`}
                      >
                        <span>{m.emoji}</span> {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <label className='block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1'>
                  Refund Amount (₹)
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold'>₹</span>
                  <input
                    type='number'
                    value={form.refundAmount}
                    onChange={e => setForm(p => ({ ...p, refundAmount: e.target.value }))}
                    placeholder={`Max: ${ret.totalAmt}`}
                    className='w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white'
                  />
                </div>
                {isCOD && (
                  <p className='text-[10px] text-yellow-600 mt-1 flex items-center gap-1'>
                    <FaWallet size={9} /> COD — refund will be credited to customer wallet automatically
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className='block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1'>
                  Note to Customer (optional)
                </label>
                <textarea
                  value={form.adminNote}
                  onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))}
                  rows={2}
                  placeholder='e.g. Pickup will be scheduled within 2 working days...'
                  className='w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white resize-none'
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className='w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const REJECTED_STATUS = 'Rejected'

const AdminReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchReturns = async (status = 'all') => {
    try {
      setLoading(true)
      const res = await Axios({ ...SummaryApi.getAllReturnsAdmin, params: { status, limit: 200 } })
      if (res.data.success) setReturns(res.data.data)
    } catch {
      toast.error('Failed to load return requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReturns(filterStatus) }, [filterStatus])

  const handleUpdated = (updated) => {
    setReturns(prev => prev.map(r => r._id === updated._id ? updated : r))
    setSelected(null)
  }

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const filtered = returns.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.orderDisplayId?.toLowerCase().includes(q) ||
      r.userId?.name?.toLowerCase().includes(q) ||
      r.userId?.email?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    )
  })

  const stats = {
    total:     returns.length,
    pending:   returns.filter(r => r.status === 'Pending').length,
    pickup:    returns.filter(r => r.status === 'Pick Up Scheduled').length,
    refunded:  returns.filter(r => r.status === 'Refunded').length,
    rejected:  returns.filter(r => r.status === 'Rejected').length,
  }

  const FILTER_TABS = [
    { label: 'All',              value: 'all',               count: stats.total },
    { label: '⏳ Pending',        value: 'Pending',           count: stats.pending },
    { label: '🚚 Pick Up',        value: 'Pick Up Scheduled', count: stats.pickup },
    { label: '💰 Refunded',       value: 'Refunded',          count: stats.refunded },
    { label: '❌ Rejected',       value: 'Rejected',          count: stats.rejected },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── Sticky Header ── */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='p-4 max-w-5xl mx-auto space-y-3'>
          <BackButton className='mb-1' />

          {/* Title row */}
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0'>
              <FaUndoAlt className='text-orange-600' size={16} />
            </div>
            <div>
              <h1 className='font-bold text-lg text-gray-800'>Return Requests</h1>
              <p className='text-xs text-gray-500'>{returns.length} total return requests</p>
            </div>
          </div>

          {/* Stats row */}
          <div className='grid grid-cols-5 gap-2'>
            {[
              { label: 'Total',     val: stats.total,    bg: 'bg-gray-50',    text: 'text-gray-700',   sub: 'text-gray-400' },
              { label: 'Pending',   val: stats.pending,  bg: 'bg-yellow-50',  text: 'text-yellow-700', sub: 'text-yellow-400' },
              { label: 'Pick Up',   val: stats.pickup,   bg: 'bg-indigo-50',  text: 'text-indigo-700', sub: 'text-indigo-400' },
              { label: 'Refunded',  val: stats.refunded, bg: 'bg-green-50',   text: 'text-green-700',  sub: 'text-green-400' },
              { label: 'Rejected',  val: stats.rejected, bg: 'bg-red-50',     text: 'text-red-700',    sub: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                <p className={`text-[9px] font-bold uppercase tracking-wide ${s.sub}`}>{s.label}</p>
                <p className={`text-xl font-bold ${s.text}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className='relative'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search by order ID, customer name or email, reason...'
              className='w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-gray-50'
            />
          </div>

          {/* Filter tabs */}
          <div className='flex gap-2 overflow-x-auto pb-0.5 scrollbar-none'>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterStatus === tab.value
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterStatus === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className='max-w-5xl mx-auto p-4'>

        {loading && (
          <div className='flex justify-center py-20'>
            <div className='w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin' />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400 space-y-2'>
            <FaBox size={36} className='mb-1' />
            <p className='font-semibold text-sm'>No return requests found</p>
            {search && <p className='text-xs'>Try a different search term</p>}
          </div>
        )}

        {/* Return Cards Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
          {filtered.map(ret => {
            const preview = ret.items?.[0]?.product_details?.image?.[0]
            const firstName = ret.items?.[0]?.product_details?.name || 'Item'
            const m = STATUS_META[ret.status] || STATUS_META['Pending']
            const isCOD = ret.paymentMethod?.toUpperCase() === 'COD'

            return (
              <div
                key={ret._id}
                onClick={() => setSelected(ret)}
                className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer overflow-hidden'
              >
                {/* Top accent by status */}
                <div className={`h-1 w-full ${m.dot}`} />

                <div className='p-4'>
                  <div className='flex items-start gap-3'>
                    {/* Product image */}
                    {preview ? (
                      <div className='w-14 h-14 rounded-xl border bg-gray-50 p-1 flex-shrink-0'>
                        <img src={preview} alt='' className='w-full h-full object-contain' />
                      </div>
                    ) : (
                      <div className='w-14 h-14 rounded-xl border bg-gray-100 flex items-center justify-center flex-shrink-0'>
                        <FaBox className='text-gray-300' size={18} />
                      </div>
                    )}

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='font-semibold text-gray-800 text-sm line-clamp-1'>
                            {ret.items?.length === 1 ? firstName : `${firstName} +${ret.items.length - 1} more`}
                          </p>
                          <p className='text-[11px] font-mono text-gray-400 mt-0.5'>#{ret.orderDisplayId}</p>
                        </div>
                        <FaChevronRight className='text-gray-300 flex-shrink-0 mt-1' size={11} />
                      </div>

                      {/* Customer */}
                      <div className='flex items-center gap-1.5 mt-1.5'>
                        <div className='w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0'>
                          <FaUser className='text-orange-500' size={8} />
                        </div>
                        <p className='text-xs text-gray-600 truncate font-medium'>
                          {ret.userId?.name || ret.userId?.email || 'Customer'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <p className='text-xs text-gray-500 mt-2.5 bg-gray-50 rounded-lg px-3 py-2 line-clamp-1'>
                    📋 {ret.reason}
                  </p>

                  {/* Bottom row */}
                  <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-50'>
                    <div className='flex items-center gap-2'>
                      <StatusBadge status={ret.status} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCOD ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isCOD ? '💵 COD' : '💳 Online'}
                      </span>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs font-bold text-gray-800'>{DisplayPriceInRupees(ret.totalAmt)}</p>
                      <p className='text-[10px] text-gray-400'>{formatDate(ret.createdAt)}</p>
                    </div>
                  </div>

                  {/* Admin note preview */}
                  {ret.adminNote && (
                    <p className='text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 mt-2 line-clamp-1'>
                      💬 {ret.adminNote}
                    </p>
                  )}
                  {ret.refundAmount > 0 && ret.status === 'Refunded' && (
                    <p className='text-[11px] text-green-700 font-semibold mt-1.5 flex items-center gap-1'>
                      ✅ Refunded {DisplayPriceInRupees(ret.refundAmount)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          ret={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}

export default AdminReturns
