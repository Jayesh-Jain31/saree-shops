import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from './AddToCartButton'
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { valideURLConvert } from '../utils/valideURLConvert'

const YouMayAlsoLike = ({ productId }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    Axios({ ...SummaryApi.getRecommendations, url: `${SummaryApi.getRecommendations.url}/${productId}`, params: { limit: 12 } })
      .then(res => { if (res.data.success) setProducts(res.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (products.length <= 3 || isPaused) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
      return
    }
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const el = scrollRef.current
        const itemWidth = el.firstChild?.offsetWidth + 12 || 200
        const maxScroll = el.scrollWidth - el.clientWidth
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          el.scrollBy({ left: itemWidth, behavior: 'smooth' })
        }
      }
    }, 3000)
    return () => clearInterval(autoScrollRef.current)
  }, [products.length, isPaused])

  const scroll = useCallback((dir) => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const itemWidth = el.firstChild?.offsetWidth + 12 || 200
    el.scrollBy({ left: dir * itemWidth, behavior: 'smooth' })
  }, [])

  const canScroll = products.length > 3

  if (loading) return (
    <div className='mt-10 px-4'>
      <div className='flex items-center gap-2 mb-4'>
        <div className='w-8 h-8 rounded-full bg-gray-100 animate-pulse' />
        <div className='w-40 h-5 bg-gray-100 rounded animate-pulse' />
      </div>
      <div className='flex gap-3'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='min-w-[160px] w-[160px] rounded-2xl bg-gray-100 animate-pulse h-60' />
        ))}
      </div>
    </div>
  )

  if (!products.length) return null

  return (
    <div className='mt-10 px-4'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xl'>✨</span>
          <h2 className='text-lg font-bold text-gray-800'>You May Also Like</h2>
        </div>
        {canScroll && (
          <div className='flex items-center gap-1.5'>
            <button
              onClick={() => scroll(-1)}
              className='w-7 h-7 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all'
              aria-label='Previous'
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => scroll(1)}
              className='w-7 h-7 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all'
              aria-label='Next'
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal scrollable row */}
      <div
        ref={scrollRef}
        className='flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2 -mx-1 px-1'
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 5000)}
      >
        {products.map(product => {
          const discountedPrice = pricewithDiscount(product.price, product.discount)
          const hasDiscount = product.discount > 0
          return (
            <Link
              key={product._id}
              to={`/product/${valideURLConvert(product.name)}-${product._id}`}
              className='min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] flex-shrink-0 bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group'
            >
              <div className='relative'>
                <div className='w-full aspect-[3/4] bg-gray-50 overflow-hidden'>
                  <img
                    src={product.image?.[0]}
                    alt={product.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    loading='lazy'
                  />
                </div>
                {hasDiscount && (
                  <span className='absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full'>
                    {product.discount}% OFF
                  </span>
                )}
                {product.stock === 0 && (
                  <span className='absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold'>
                    Out of Stock
                  </span>
                )}
              </div>
              <div className='p-2.5 sm:p-3'>
                <p className='text-[11px] sm:text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1'>
                  {product.name}
                </p>
                {product.avgRating > 0 && (
                  <div className='flex items-center gap-0.5 mb-1'>
                    <FaStar size={8} className='text-yellow-400' />
                    <span className='text-[10px] text-gray-500'>{product.avgRating.toFixed(1)}</span>
                    <span className='text-[9px] text-gray-400'>· {product.reviewCount || 0} reviews</span>
                  </div>
                )}
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <p className='text-xs sm:text-sm font-black text-gray-800'>
                    {DisplayPriceInRupees(discountedPrice)}
                  </p>
                  {hasDiscount && (
                    <p className='text-[9px] sm:text-[10px] text-gray-400 line-through'>
                      {DisplayPriceInRupees(product.price)}
                    </p>
                  )}
                </div>
                <div className='mt-2' onClick={e => e.preventDefault()}>
                  <AddToCartButton data={product} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default YouMayAlsoLike
