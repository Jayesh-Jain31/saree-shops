import React, { useRef, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'

const ItemRating = ({ orderId, productId, productName, initialRating = 0, onRated }) => {
  const pid = String(productId || '')
  const oid = String(orderId || '')

  const [submitted, setSubmitted] = useState(initialRating > 0)
  const [savedRating, setSavedRating] = useState(initialRating)
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  const handleRate = async (star) => {
    if (submitting.current || loading || submitted) return
    submitting.current = true
    setLoading(true)
    setSubmitted(true)
    setSavedRating(star)
    try {
      await Axios({
        ...SummaryApi.addReview,
        data: { productId: pid, rating: star, comment: '', orderId: oid }
      })
      toast.success(`Rated ${productName || 'item'}!`)
      if (onRated) onRated(pid, star)
    } catch {
      setSubmitted(false)
      setSavedRating(0)
      toast.error('Could not save rating, please try again')
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  if (submitted) {
    return (
      <div className='flex items-center gap-1 mt-1.5'>
        {[1, 2, 3, 4, 5].map(s => (
          <FaStar key={s} size={16} className={s <= savedRating ? 'text-yellow-400' : 'text-gray-200'} />
        ))}
        <span className='text-[11px] text-gray-400 font-medium ml-1'>Rated</span>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-0.5 mt-1.5' onClick={e => e.stopPropagation()}>
      <span className='text-[11px] text-gray-400 mr-1'>Rate:</span>
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
          <FaStar size={16} className={hover >= s ? 'text-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  )
}

export default ItemRating
