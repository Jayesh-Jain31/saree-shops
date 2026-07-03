import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import { MdAccessTime } from 'react-icons/md'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const RecentlyViewed = () => {
  const [items, setItems] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      setItems(stored)
    } catch (e) {}
  }, [])

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (items.length <= 3 || isPaused) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
      return
    }
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const el = scrollRef.current
        const itemWidth = el.firstChild?.offsetWidth + 12 || 160 // card width + gap
        const maxScroll = el.scrollWidth - el.clientWidth
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          el.scrollBy({ left: itemWidth, behavior: 'smooth' })
        }
      }
    }, 3000)
    return () => clearInterval(autoScrollRef.current)
  }, [items.length, isPaused])

  const scroll = useCallback((dir) => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const itemWidth = el.firstChild?.offsetWidth + 12 || 160
    el.scrollBy({ left: dir * itemWidth, behavior: 'smooth' })
  }, [])

  const canScroll = items.length > 3

  if (items.length === 0) return null

  return (
    <div className='container mx-auto px-4 my-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center'>
            <MdAccessTime className='text-gray-600' size={16} />
          </div>
          <div>
            <h2 className='font-bold text-lg text-gray-800 leading-tight'>Recently Viewed</h2>
            <p className='text-[11px] text-gray-400'>Products you checked out</p>
          </div>
        </div>
        {canScroll && (
          <div className='flex items-center gap-1.5'>
            <button
              onClick={() => scroll(-1)}
              className='w-7 h-7 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all'
              aria-label='Scroll left'
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => scroll(1)}
              className='w-7 h-7 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all'
              aria-label='Scroll right'
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className='flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2'
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 5000)}
      >
        {items.map((item) => {
          const url = `/product/${valideURLConvert(item.name)}-${item._id}`
          return (
            <Link
              key={item._id}
              to={url}
              className='min-w-[150px] w-[150px] sm:min-w-[170px] sm:w-[170px] bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all flex-shrink-0 group'
            >
              <div className='h-36 sm:h-40 bg-gray-50 p-3 flex items-center justify-center overflow-hidden'>
                <img
                  src={item.image}
                  alt={item.name}
                  className='max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300'
                  loading='lazy'
                />
              </div>
              <div className='p-2.5 sm:p-3'>
                <p className='text-[11px] sm:text-xs font-semibold text-gray-700 line-clamp-2 leading-snug mb-1.5'>
                  {item.name}
                </p>
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <p className='text-xs font-black text-gray-800'>
                    {DisplayPriceInRupees(pricewithDiscount(item.price, item.discount))}
                  </p>
                  {item.discount > 0 && (
                    <p className='text-[9px] text-gray-400 line-through'>
                      {DisplayPriceInRupees(item.price)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RecentlyViewed
