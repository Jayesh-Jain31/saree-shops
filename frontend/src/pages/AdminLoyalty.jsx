import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { GiDiamondTrophy } from 'react-icons/gi'
import { FaSearch, FaCoins } from 'react-icons/fa'

const AdminLoyalty = () => {
  const [loyalties, setLoyalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjPoints, setAdjPoints] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.adminGetAllLoyalty, params: { limit: 200 } })
      if (res.data.success) setLoyalties(res.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleAdjust = async () => {
    if (!adjPoints || !adjReason.trim()) { toast.error('Enter points and reason'); return }
    setAdjusting(true)
    try {
      const res = await Axios({
        ...SummaryApi.adminAdjustLoyalty,
        data: { userId: adjustModal.userId?._id, points: parseInt(adjPoints), reason: adjReason }
      })
      if (res.data.success) {
        toast.success('Points adjusted!')
        setAdjustModal(null)
        setAdjPoints('')
        setAdjReason('')
        fetchAll()
      }
    } catch (e) { AxiosToastError(e) }
    finally { setAdjusting(false) }
  }

  const filtered = loyalties.filter(l => {
    const q = search.toLowerCase()
    return (
      l.userId?.name?.toLowerCase().includes(q) ||
      l.userId?.email?.toLowerCase().includes(q) ||
      l.userId?.mobile?.toString().includes(q)
    )
  })

  const totalPoints = loyalties.reduce((acc, l) => acc + (l.points || 0), 0)

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center gap-3 mb-6'>
          <GiDiamondTrophy className='text-yellow-500' size={28} />
          <h1 className='text-2xl font-bold text-gray-800'>Loyalty Points Management</h1>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-2xl border p-4 shadow-sm'>
            <p className='text-xs text-gray-400 font-medium'>Total Members</p>
            <p className='text-3xl font-black text-gray-800'>{loyalties.length}</p>
          </div>
          <div className='bg-white rounded-2xl border p-4 shadow-sm'>
            <p className='text-xs text-gray-400 font-medium'>Total Outstanding Points</p>
            <p className='text-3xl font-black text-yellow-600'>{totalPoints.toLocaleString()}</p>
          </div>
          <div className='bg-white rounded-2xl border p-4 shadow-sm col-span-2 md:col-span-1'>
            <p className='text-xs text-gray-400 font-medium'>Redeemable Value</p>
            <p className='text-3xl font-black text-green-600'>
              ₹{(totalPoints * 0.25).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className='relative mb-4'>
          <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
          <input
            type='text' placeholder='Search by name, email, or mobile...'
            value={search} onChange={e => setSearch(e.target.value)}
            className='w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400'
          />
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin' />
          </div>
        ) : (
          <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
            {!filtered.length ? (
              <div className='text-center py-12 text-gray-400'>No loyalty records found</div>
            ) : (
              <div className='divide-y divide-gray-50'>
                {filtered.map((l) => (
                  <div key={l._id} className='flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition'>
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold text-gray-800 text-sm'>{l.userId?.name || 'Unknown'}</p>
                      <p className='text-xs text-gray-400'>{l.userId?.email}</p>
                      {l.userId?.mobile && <p className='text-xs text-gray-400'>{l.userId.mobile}</p>}
                    </div>
                    <div className='text-center mx-4'>
                      <p className='text-2xl font-black text-yellow-600'>{l.points}</p>
                      <p className='text-[10px] text-gray-400'>points</p>
                    </div>
                    <div className='text-center mx-4 hidden sm:block'>
                      <p className='text-sm font-bold text-green-600'>{l.totalEarned}</p>
                      <p className='text-[10px] text-gray-400'>earned</p>
                    </div>
                    <div className='text-center mx-4 hidden sm:block'>
                      <p className='text-sm font-bold text-blue-600'>{l.totalRedeemed}</p>
                      <p className='text-[10px] text-gray-400'>redeemed</p>
                    </div>
                    <button
                      onClick={() => setAdjustModal(l)}
                      className='ml-2 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl text-xs font-semibold transition flex items-center gap-1'
                    >
                      <FaCoins size={10} /> Adjust
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl'>
            <h3 className='font-bold text-lg text-gray-800 mb-1'>Adjust Points</h3>
            <p className='text-sm text-gray-500 mb-4'>{adjustModal.userId?.name} · Current: <strong>{adjustModal.points} pts</strong></p>
            <div className='space-y-3'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Points (use negative to deduct)</label>
                <input
                  type='number' step='1'
                  value={adjPoints} onChange={e => setAdjPoints(e.target.value)}
                  placeholder='e.g. 100 or -50'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Reason</label>
                <input
                  type='text'
                  value={adjReason} onChange={e => setAdjReason(e.target.value)}
                  placeholder='e.g. Loyalty bonus, refund adjustment'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
              </div>
            </div>
            <div className='flex gap-2 mt-5'>
              <button onClick={() => setAdjustModal(null)}
                className='flex-1 border border-gray-200 rounded-xl py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition'>
                Cancel
              </button>
              <button onClick={handleAdjust} disabled={adjusting}
                className='flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl py-2 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2'>
                {adjusting && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLoyalty
