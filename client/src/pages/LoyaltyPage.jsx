import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { GiDiamondTrophy } from 'react-icons/gi'
import { FaCoins, FaHistory, FaWallet, FaClock, FaCheckCircle } from 'react-icons/fa'
import { MdAccountBalanceWallet } from 'react-icons/md'

const LoyaltyPage = () => {
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [pendingData, setPendingData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [loyaltyRes, pendingRes] = await Promise.all([
          Axios({ ...SummaryApi.getMyLoyalty }),
          Axios({ ...SummaryApi.getMyPendingLoyalty }),
        ])
        if (loyaltyRes.data.success) setLoyaltyData(loyaltyRes.data.data)
        if (pendingRes.data.success) setPendingData(pendingRes.data.data)
      } catch {} finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full' />
    </div>
  )

  const s = loyaltyData?.settings
  const earnPer   = s?.earnPer100 ?? 10
  const pointVal  = s?.pointValue ?? 0.25
  const returnDays = pendingData?.returnPeriodDays ?? 7
  const totalPending = pendingData?.totalPendingRupees ?? 0
  const pendingItems = pendingData?.items ?? []

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className='min-h-screen bg-gray-50 py-6 px-4'>
      <div className='max-w-lg mx-auto space-y-4'>
        <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
          <GiDiamondTrophy className='text-yellow-500' />
          Loyalty Rewards
        </h1>

        {/* ── Pending wallet credits hero ── */}
        <div className='bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg'>
          <div className='flex items-center gap-2 mb-1'>
            <MdAccountBalanceWallet size={18} className='opacity-80' />
            <p className='text-sm font-medium opacity-80'>Pending Wallet Credits</p>
          </div>
          <p className='text-5xl font-black tracking-tight'>{DisplayPriceInRupees(totalPending)}</p>
          <p className='text-sm mt-1 opacity-90'>
            {pendingItems.length > 0
              ? `From ${pendingItems.length} order${pendingItems.length > 1 ? 's' : ''} — credited after the ${returnDays}-day return window`
              : 'No pending credits right now'}
          </p>
          <div className='mt-4 bg-white/15 rounded-xl px-4 py-2.5 text-xs'>
            Your reward points are automatically converted to wallet balance after the return period ends.
            No action needed — it happens automatically!
          </div>
        </div>

        {/* ── Pending orders breakdown ── */}
        {pendingItems.length > 0 && (
          <div className='bg-white rounded-2xl border shadow-sm p-5'>
            <h2 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <FaClock className='text-orange-400' />
              Upcoming Credits
            </h2>
            <div className='space-y-3'>
              {pendingItems.map((item, i) => (
                <div key={i} className={`rounded-xl p-3.5 border ${item.ready ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-100'}`}>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs font-semibold text-gray-500 truncate'>{item.orderId}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.ready ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                      {item.ready ? 'Processing soon' : `${item.daysLeft}d left`}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-bold text-gray-800'>{DisplayPriceInRupees(item.rupeeValue)}</p>
                      <p className='text-xs text-gray-500'>
                        {item.ready
                          ? 'Return window closed — will be credited shortly'
                          : `Credits on ${formatDate(item.creditDate)}`}
                      </p>
                    </div>
                    {item.ready
                      ? <FaCheckCircle className='text-green-500' size={20} />
                      : <FaClock className='text-orange-400' size={18} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How it works ── */}
        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <h2 className='font-bold text-gray-800 mb-3 flex items-center gap-2'>
            <FaCoins className='text-yellow-500' />
            How it works
          </h2>
          <ul className='space-y-3 text-sm text-gray-600'>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>1</span>
              <span>Earn <strong>{earnPer} points</strong> for every ₹100 you spend on any order.</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>2</span>
              <span>Points are held for <strong>{returnDays} days</strong> after delivery — your return protection window.</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>3</span>
              <span>After the window closes, your points are <strong>automatically credited to your wallet</strong> as real money — {DisplayPriceInRupees(pointVal)} per point.</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>4</span>
              <span>Your wallet balance is <strong>automatically applied</strong> to future orders at checkout. No codes needed!</span>
            </li>
          </ul>
          <div className='mt-4 bg-yellow-50 rounded-xl p-3 text-xs text-yellow-700'>
            <strong>Example:</strong> Spend ₹1,000 → earn {Math.floor(1000 / 100) * earnPer} pts →
            after {returnDays} days → {DisplayPriceInRupees(Math.floor(1000 / 100) * earnPer * pointVal)} added to your wallet automatically.
          </div>
        </div>

        {/* ── Old loyalty balance (if any) ── */}
        {(loyaltyData?.points ?? 0) > 0 && (
          <div className='bg-white rounded-2xl border shadow-sm p-5'>
            <h2 className='font-bold text-gray-800 mb-3 flex items-center gap-2'>
              <FaWallet className='text-gray-500' />
              Legacy Points Balance
            </h2>
            <div className='bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between'>
              <div>
                <p className='text-2xl font-black text-gray-800'>{loyaltyData.points} pts</p>
                <p className='text-xs text-gray-500 mt-0.5'>≈ {DisplayPriceInRupees(loyaltyData.rupeeValue ?? 0)}</p>
              </div>
              <GiDiamondTrophy className='text-yellow-400' size={36} />
            </div>
            <p className='text-xs text-gray-400 mt-2'>These are points accumulated under the old system. Contact support if you have questions.</p>
          </div>
        )}

        {/* ── Transaction history ── */}
        {(loyaltyData?.transactions?.length ?? 0) > 0 && (
          <div className='bg-white rounded-2xl border shadow-sm p-5'>
            <h2 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <FaHistory className='text-gray-400' />
              Points History
            </h2>
            <div className='space-y-2'>
              {loyaltyData.transactions.map((t, i) => {
                const isPositive = t.points >= 0
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl p-3 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className='min-w-0 flex-1'>
                      <p className={`font-semibold text-sm capitalize ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
                        {t.type}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>{t.description}</p>
                      <p className='text-[10px] text-gray-400 mt-0.5'>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}Balance: {t.balanceAfter} pts
                      </p>
                    </div>
                    <p className={`font-black text-lg ml-3 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{t.points}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {pendingItems.length === 0 && (loyaltyData?.transactions?.length ?? 0) === 0 && (
          <div className='bg-white rounded-2xl border shadow-sm p-10 text-center'>
            <GiDiamondTrophy className='text-gray-200 mx-auto mb-3' size={52} />
            <p className='text-gray-500 font-medium'>No rewards yet</p>
            <p className='text-gray-400 text-sm mt-1'>Place an order to start earning wallet credits!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoyaltyPage
