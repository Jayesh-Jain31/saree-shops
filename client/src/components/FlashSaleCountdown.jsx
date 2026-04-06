import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { FaBolt } from 'react-icons/fa'

const pad = (n) => String(n).padStart(2, '0')

const FlashSaleCountdown = () => {
  const [saleData, setSaleData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          const s = res.data.data
          if (s.flash_sale_enabled === 'true' && s.flash_sale_end_time) {
            setSaleData({
              title: s.flash_sale_title || '🔥 Flash Sale',
              endTime: new Date(s.flash_sale_end_time),
              discount: s.flash_sale_discount || '',
            })
          }
        }
      } catch {}
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!saleData) return
    const tick = () => {
      const now = new Date()
      const diff = saleData.endTime - now
      if (diff <= 0) {
        setTimeLeft(null)
        setSaleData(null)
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s })
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [saleData])

  if (!saleData || !timeLeft) return null

  return (
    <div className='bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 px-4'>
      <div className='container mx-auto flex items-center justify-between flex-wrap gap-2'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center'>
            <FaBolt className='text-yellow-300' size={14} />
          </div>
          <div>
            <p className='font-bold text-sm leading-tight'>{saleData.title}</p>
            {saleData.discount && (
              <p className='text-xs text-white/80'>Up to {saleData.discount}% OFF on all products</p>
            )}
          </div>
        </div>

        {/* Countdown */}
        <div className='flex items-center gap-1'>
          <p className='text-xs text-white/80 mr-1'>Ends in:</p>
          {[
            { v: timeLeft.h, label: 'hr' },
            { v: timeLeft.m, label: 'min' },
            { v: timeLeft.s, label: 'sec' },
          ].map(({ v, label }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span className='text-white/60 font-bold mx-0.5'>:</span>}
              <div className='bg-black/30 rounded-lg px-2 py-1 min-w-[42px] text-center'>
                <p className='text-base font-bold leading-none'>{pad(v)}</p>
                <p className='text-[9px] text-white/70 uppercase'>{label}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FlashSaleCountdown
