import React, { useEffect, useRef, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'

const ItemRating = ({ orderId, productId, productName, compact = false, reviewedMap = {} }) => {
  const pid = String(productId || '')
  const key = orderId && pid ? `rated_item_${orderId}_${pid}` : null

  const getInitialState = () => {
    if (reviewedMap[pid]) return { submitted: true, savedRating: reviewedMap[pid] }
    try {
      if (key) {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (saved?.rating) return { submitted: true, savedRating: saved.rating }
      }
    } catch {}
    return { submitted: false, savedRating: 0 }
  }

  const initial = getInitialState()
  const [submitted, setSubmitted] = useState(initial.submitted)
  const [savedRating, setSavedRating] = useState(initial.savedRating)
  const [hover, setHover] = useState(0)
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  useEffect(() => {
    if (reviewedMap[pid]) {
      setSubmitted(true)
      setSavedRating(reviewedMap[pid])
      return
    }
    try {
      if (key) {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (saved?.rating) { setSubmitted(true); setSavedRating(saved.rating) }
      }
    } catch {}
  }, [pid, key, reviewedMap])

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
