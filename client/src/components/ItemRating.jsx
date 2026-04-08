import React, { useEffect, useRef, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'

const ItemRating = ({ orderId, productId, productName, compact = false }) => {
  const pid = String(productId || '')
  const oid = String(orderId || '')
  const key = oid && pid ? `rated_item_${oid}_${pid}` : null

  const [submitted, setSubmitted] = useState(false)
  const [savedRating, setSavedRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  useEffect(() => {
    if (!key) return
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null')
      if (saved?.rating) {
        setSubmitted(true)
        setSavedRating(saved.rating)
      }
    } catch {}
  }, [key])

  const handleRate = async (star) => {
    if (submitting.current || loading) return
    submitting.current = true
    setLoading(true)
    setSelected(star)
    if (key) localStorage.setItem(key, JSON.stringify({ rating: star }))
    setSubmitted(true)
    setSavedRating(star)
    try {
      await Axios({ ...SummaryApi.addReview, data: { productId: pid, rating: star, comment: '' } })
      toast.success(`Rated ${productName || 'item'}!`)
    } catch {
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const starSize = compact ? 14 : 18

  if (submitted) {
    return (
      <div className='flex items-center gap-1 mt-1.5'>
        {[1, 2, 3, 4, 5].map(s => (
          <FaStar key={s} size={starSize} className={s <= savedRating ? 'text-yellow-400' : 'text-gray-200'} />
        ))}
        {!compact && <span className='text-[11px] text-gray-400 font-medium ml-1'>Rated</span>}
      </div>
    )
  }

  return (
    <div className='flex items-center gap-0.5 mt-1.5' onClick={e => e.stopPropagation()}>
      {!compact && <span className='text-[11px] text-gray-400 mr-1'>Rate:</span>}
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={e => { e.stopPropagation(); handleRate(s) }}
          disabled={loading}
          className='transition-transform hover:scale-125 active:scale-95 disabled:opacity-50'
          type='button'
        >
          <FaStar size={starSize} className={(hover || selected) >= s ? 'text-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  )
}

export default ItemRating
