import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { GiDiamondTrophy } from 'react-icons/gi'
import { FaCoins, FaHistory } from 'react-icons/fa'

const typeConfig = {
  earned: { label: 'Earned', color: 'text-green-600', bg: 'bg-green-50', sign: '+' },
  redeemed: { label: 'Redeemed', color: 'text-blue-600', bg: 'bg-blue-50', sign: '-' },
  bonus: { label: 'Bonus', color: 'text-purple-600', bg: 'bg-purple-50', sign: '+' },
  deducted: { label: 'Deducted', color: 'text-red-500', bg: 'bg-red-50', sign: '-' },
  expired: { label: 'Expired', color: 'text-gray-400', bg: 'bg-gray-50', sign: '-' },
}

const LoyaltyPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLoyalty = async () => {
      setLoading(true)
      try {
        const res = await Axios({ ...SummaryApi.getMyLoyalty })
        if (res.data.success) setData(res.data.data)
      } catch {} finally { setLoading(false) }
    }
    fetchLoyalty()
  }, [])

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full' />
    </div>
  )

  const s = data?.settings
  const earnPer = s?.earnPer100 ?? 10
  const pointVal = s?.pointValue ?? 0.25
  const minRedeem = s?.minRedeem ?? 50
  const maxPct = s?.maxRedeemPct ?? 50

  return (
    <div className='min-h-screen bg-gray-50 py-6 px-4'>
      <div className='max-w-lg mx-auto space-y-4'>
        <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
          <GiDiamondTrophy className='text-yellow-500' />
          Loyalty Points
        </h1>

        {/* ─ Balance Card ─ */}
        <div className='bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl p-6 text-white shadow-lg'>
          <p className='text-sm font-medium opacity-80 mb-1'>Your Points Balance</p>
          <p className='text-5xl font-black tracking-tight'>{data?.points ?? 0}</p>
          <p className='text-sm mt-1 opacity-90'>≈ {DisplayPriceInRupees(data?.rupeeValue ?? 0)} redeemable value</p>
          <div className='mt-4 flex gap-4 text-xs opacity-80'>
            <div>
              <p className='font-bold text-base text-white'>{data?.totalEarned ?? 0}</p>
              <p>Total Earned</p>
            </div>
            <div>
              <p className='font-bold text-base text-white'>{data?.totalRedeemed ?? 0}</p>
              <p>Total Redeemed</p>
            </div>
          </div>
        </div>

        {/* ─ How it works ─ */}
        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <h2 className='font-bold text-gray-800 mb-3 flex items-center gap-2'>
            <FaCoins className='text-yellow-500' />
            How it works
          </h2>
          <ul className='space-y-2 text-sm text-gray-600'>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>1</span>
              <span>Earn <strong>{earnPer} points</strong> for every ₹100 spent on your orders.</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>2</span>
              <span>Every point is worth <strong>{DisplayPriceInRupees(pointVal)}</strong>. Redeem at checkout as a discount.</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>3</span>
              <span>Minimum <strong>{minRedeem} points</strong> needed to redeem. You can redeem up to <strong>{maxPct}%</strong> of your order value.</span>
            </li>
          </ul>
        </div>

        {/* ─ Transactions ─ */}
        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <h2 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
            <FaHistory className='text-gray-400' />
            Points History
          </h2>
          {!data?.transactions?.length ? (
            <div className='text-center py-8'>
              <GiDiamondTrophy className='text-gray-200 mx-auto mb-3' size={48} />
              <p className='text-gray-400 text-sm'>No transactions yet. Place an order to start earning!</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {data.transactions.map((t, i) => {
                const cfg = typeConfig[t.type] || typeConfig.earned
                const absPoints = Math.abs(t.points)
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl p-3 ${cfg.bg}`}>
                    <div className='min-w-0 flex-1'>
                      <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
                      <p className='text-xs text-gray-500 truncate'>{t.description}</p>
                      <p className='text-[10px] text-gray-400 mt-0.5'>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}Balance: {t.balanceAfter} pts
                      </p>
                    </div>
                    <p className={`font-black text-lg ml-3 ${cfg.color}`}>
                      {cfg.sign}{absPoints}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoyaltyPage
