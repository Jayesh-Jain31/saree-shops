import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import {
  FaUser, FaPhone, FaEnvelope, FaWallet, FaShoppingBag,
  FaCheckCircle, FaTimes, FaArrowLeft, FaMoneyBillWave,
  FaCreditCard, FaPlus, FaMinus, FaBan, FaUnlock, FaHistory
} from 'react-icons/fa'
import {
  MdPending, MdInventory, MdDone, MdLocalShipping, MdBlock,
  MdVerifiedUser, MdEdit, MdPerson
} from 'react-icons/md'

const statusConfig = {
  'Pending':          { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <MdPending size={11} /> },
  'Confirmed':        { color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <FaCheckCircle size={9} /> },
  'Shipped':          { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <MdInventory size={11} /> },
  'Out for Delivery': { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <MdLocalShipping size={11} /> },
  'Delivered':        { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <MdDone size={12} /> },
  'Cancelled':        { color: 'bg-red-50 text-red-700 border-red-200',           icon: <FaTimes size={9} /> },
}

const accountStatusConfig = {
  Active:    { color: 'bg-green-100 text-green-700',  label: 'Active' },
  Inactive:  { color: 'bg-gray-100 text-gray-600',    label: 'Inactive' },
  Suspended: { color: 'bg-red-100 text-red-700',      label: 'Suspended' },
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const StatCard = ({ icon, label, value, color }) => (
  <div className='bg-white rounded-2xl border p-4 flex items-center gap-3'>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className='text-[11px] text-gray-400 font-medium'>{label}</p>
      <p className='text-base font-bold text-gray-800'>{value}</p>
    </div>
  </div>
)

const AdminCustomerDetail = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletNote, setWalletNote] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [codLoading, setCodLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showTx, setShowTx] = useState(false)

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const res = await Axios({ url: `/api/analytics/customer/${userId}`, method: 'get' })
      if (res.data.success) setData(res.data.data)
      else toast.error('Failed to load customer')
    } catch { toast.error('Failed to load customer') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomer() }, [userId])

  const handleCODToggle = async () => {
    setCodLoading(true)
    try {
      const res = await Axios({ url: `/api/analytics/customer/${userId}/cod`, method: 'put' })
      if (res.data.success) {
        toast.success(res.data.message)
        setData(d => ({ ...d, user: { ...d.user, codRestricted: res.data.data.codRestricted } }))
      }
    } catch { toast.error('Failed to update COD setting') }
    finally { setCodLoading(false) }
  }

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true)
    try {
      const res = await Axios({ url: `/api/analytics/customer/${userId}/status`, method: 'put', data: { status: newStatus } })
      if (res.data.success) {
        toast.success(res.data.message)
        setData(d => ({ ...d, user: { ...d.user, status: newStatus } }))
      }
    } catch { toast.error('Failed to update account status') }
    finally { setStatusLoading(false) }
  }

  const handleWalletAdjust = async (type) => {
    const amt = parseFloat(walletAmount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')
    setWalletLoading(true)
    try {
      const res = await Axios({
        url: `/api/analytics/customer/${userId}/wallet`,
        method: 'post',
        data: { type, amount: amt, description: walletNote || (type === 'credit' ? 'Admin credit' : 'Admin deduction') }
      })
      if (res.data.success) {
        toast.success(res.data.message)
        setData(d => ({ ...d, wallet: res.data.data }))
        setWalletAmount('')
        setWalletNote('')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Wallet operation failed')
    }
    finally { setWalletLoading(false) }
  }

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  if (!data) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400'>
        <FaUser size={36} />
        <p>Customer not found</p>
        <button onClick={() => navigate(-1)} className='text-blue-500 text-sm underline'>Go back</button>
      </div>
    )
  }

  const { user, stats, recentOrders, wallet } = data
  const acfg = accountStatusConfig[user.status] || accountStatusConfig.Active

  return (
    <div className='p-4 max-w-2xl mx-auto space-y-4 pb-10'>

      {/* Back */}
      <button onClick={() => navigate(-1)} className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-1'>
        <FaArrowLeft size={12} /> Back to Orders
      </button>

      {/* Profile Card */}
      <div className='bg-white rounded-2xl border p-5'>
        <div className='flex items-start gap-4'>
          <div className='relative flex-shrink-0'>
            {user.avatar ? (
              <img src={user.avatar} alt='' className='w-16 h-16 rounded-2xl object-cover border' />
            ) : (
              <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl'>
                {(user.name || 'U')[0].toUpperCase()}
              </div>
            )}
            {user.verify_email && (
              <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white'>
                <MdDone size={10} className='text-white' />
              </div>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2 flex-wrap'>
              <div>
                <h1 className='text-lg font-bold text-gray-800'>{user.name}</h1>
                <p className='text-[11px] text-gray-400 mt-0.5'>Joined {fmt(user.createdAt)}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${acfg.color}`}>{acfg.label}</span>
            </div>
            <div className='mt-2.5 space-y-1.5'>
              {user.email && (
                <p className='text-xs text-gray-500 flex items-center gap-2'>
                  <FaEnvelope size={11} className='text-gray-400' /> {user.email}
                  {user.verify_email && <span className='text-green-600 text-[10px] font-semibold'>✓ Verified</span>}
                </p>
              )}
              {user.mobile && (
                <p className='text-xs text-gray-500 flex items-center gap-2'>
                  <FaPhone size={10} className='text-gray-400' /> +{user.mobile}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-3'>
        <StatCard icon={<FaShoppingBag size={16} className='text-blue-600' />} label='Total Orders' value={stats.totalOrders} color='bg-blue-50' />
        <StatCard icon={<MdDone size={18} className='text-emerald-600' />} label='Delivered' value={stats.deliveredOrders} color='bg-emerald-50' />
        <StatCard icon={<FaTimes size={14} className='text-red-500' />} label='Cancelled' value={stats.cancelledOrders} color='bg-red-50' />
        <StatCard icon={<FaMoneyBillWave size={15} className='text-purple-600' />} label='Total Spent' value={DisplayPriceInRupees(stats.totalSpent)} color='bg-purple-50' />
      </div>

      {/* Controls */}
      <div className='bg-white rounded-2xl border p-4 space-y-4'>
        <h2 className='font-bold text-gray-700 text-sm flex items-center gap-2'>
          <MdEdit size={14} className='text-gray-500' /> Account Controls
        </h2>

        {/* Account Status */}
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div>
            <p className='text-sm font-semibold text-gray-700'>Account Status</p>
            <p className='text-xs text-gray-400 mt-0.5'>Suspended users cannot log in or place orders</p>
          </div>
          <select
            value={user.status}
            disabled={statusLoading}
            onChange={e => handleStatusChange(e.target.value)}
            className='px-3 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 bg-gray-50 disabled:opacity-60'
          >
            <option value='Active'>Active</option>
            <option value='Inactive'>Inactive</option>
            <option value='Suspended'>Suspended</option>
          </select>
        </div>

        <div className='border-t' />

        {/* COD Toggle */}
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
              {user.codRestricted
                ? <FaBan size={13} className='text-red-500' />
                : <FaMoneyBillWave size={13} className='text-green-500' />}
              Cash on Delivery
            </p>
            <p className='text-xs text-gray-400 mt-0.5'>
              {user.codRestricted ? 'COD is currently DISABLED for this customer' : 'COD is currently allowed for this customer'}
            </p>
          </div>
          <button
            onClick={handleCODToggle}
            disabled={codLoading}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${user.codRestricted ? 'bg-red-400' : 'bg-green-500'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${user.codRestricted ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>
      </div>

      {/* Wallet */}
      <div className='bg-white rounded-2xl border p-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='font-bold text-gray-700 text-sm flex items-center gap-2'>
            <FaWallet size={13} className='text-blue-500' /> Wallet Balance
          </h2>
          <div className='text-xl font-bold text-green-600'>{DisplayPriceInRupees(wallet.balance || 0)}</div>
        </div>

        {/* Adjust Wallet */}
        <div className='bg-gray-50 rounded-xl p-3 space-y-2.5'>
          <p className='text-xs font-semibold text-gray-600'>Adjust Balance</p>
          <input
            type='number'
            value={walletAmount}
            onChange={e => setWalletAmount(e.target.value)}
            placeholder='Enter amount (₹)'
            className='w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white'
          />
          <input
            type='text'
            value={walletNote}
            onChange={e => setWalletNote(e.target.value)}
            placeholder='Note / reason (optional)'
            className='w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white'
          />
          <div className='flex gap-2'>
            <button
              onClick={() => handleWalletAdjust('credit')}
              disabled={walletLoading}
              className='flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5'
            >
              <FaPlus size={11} /> Add Money
            </button>
            <button
              onClick={() => handleWalletAdjust('debit')}
              disabled={walletLoading}
              className='flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5'
            >
              <FaMinus size={11} /> Deduct
            </button>
          </div>
        </div>

        {/* Transaction History */}
        {wallet.transactions?.length > 0 && (
          <div>
            <button
              onClick={() => setShowTx(v => !v)}
              className='flex items-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors'
            >
              <FaHistory size={11} /> {showTx ? 'Hide' : 'Show'} Transaction History ({wallet.transactions.length})
            </button>
            {showTx && (
              <div className='mt-3 space-y-2 max-h-64 overflow-y-auto'>
                {wallet.transactions.map((tx, i) => (
                  <div key={i} className='flex items-center justify-between text-xs py-2 border-b last:border-0'>
                    <div>
                      <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+ ' : '- '}{DisplayPriceInRupees(tx.amount)}
                      </p>
                      <p className='text-gray-400 mt-0.5'>{tx.description}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-gray-500'>Bal: {DisplayPriceInRupees(tx.balanceAfter)}</p>
                      <p className='text-gray-400 mt-0.5'>{fmt(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className='bg-white rounded-2xl border p-4'>
        <h2 className='font-bold text-gray-700 text-sm flex items-center gap-2 mb-3'>
          <FaShoppingBag size={13} className='text-gray-500' /> Order History
          <span className='text-xs font-normal text-gray-400'>({stats.totalOrders} total)</span>
        </h2>
        {recentOrders.length === 0 ? (
          <p className='text-xs text-gray-400 text-center py-4'>No orders yet</p>
        ) : (
          <div className='space-y-2'>
            {recentOrders.map(order => {
              const scfg = statusConfig[order.orderStatus] || statusConfig['Pending']
              const isCOD = order.payment_status?.toUpperCase() === 'CASH ON DELIVERY'
              return (
                <div key={order._id} className='flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-[11px] font-mono text-gray-500 truncate'>{order.orderId}</p>
                    <p className='text-[10px] text-gray-400 mt-0.5'>{fmtFull(order.createdAt)}</p>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${scfg.color}`}>
                      {scfg.icon} {order.orderStatus}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isCOD ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                      {isCOD ? <FaMoneyBillWave size={8} /> : <FaCreditCard size={8} />}
                      {isCOD ? 'COD' : 'Paid'}
                    </span>
                    <p className='text-xs font-bold text-gray-700'>{DisplayPriceInRupees(order.totalAmt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default AdminCustomerDetail
