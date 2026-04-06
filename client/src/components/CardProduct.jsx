import React, { useState, useEffect, useRef } from 'react'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from './AddToCartButton'
import { FaStar, FaRegStar } from 'react-icons/fa'

const CardProduct = ({ data, grid = false }) => {
  const url = `/product/${valideURLConvert(data.name)}-${data._id}`
  const images = data.image || []
  const [imgIdx, setImgIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (images.length <= 1) return
    timerRef.current = setInterval(() => {
      setImgIdx(prev => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timerRef.current)
  }, [images.length])

  const discountedPrice = pricewithDiscount(data.price, data.discount)

  return (
    <Link
      to={url}
      className={`border rounded-xl bg-white flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
        grid ? 'w-full' : 'w-44 sm:w-48 lg:w-56 flex-shrink-0'
      }`}
    >
      {/* ── Image — fills the card, portrait aspect ── */}
      <div className='w-full aspect-[3/4] bg-gray-50 overflow-hidden relative'>
        <img
          key={imgIdx}
          src={images[imgIdx] || images[0]}
          alt={data.name}
          className='w-full h-full object-cover'
          style={{ animation: 'fadeSlideIn 0.4s ease' }}
        />

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className='absolute bottom-1.5 left-0 right-0 flex justify-center gap-1'>
            {images.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === imgIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Discount badge — top-right */}
        {Boolean(data.discount) && (
          <div className='absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm'>
            {data.discount}% OFF
          </div>
        )}

        {/* Low stock badge — top-left */}
        {data.stock > 0 && data.stock <= 5 && (
          <div className='absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm'>
            Only {data.stock} left!
          </div>
        )}

        {/* Out of Stock overlay */}
        {data.stock === 0 && (
          <div className='absolute inset-0 bg-black/40 flex flex-col items-center justify-center'>
            <div className='bg-red-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-lg tracking-widest uppercase'>
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className='flex flex-col flex-1 px-2.5 pt-2 pb-2.5 gap-1'>
        {/* Name */}
        <p className='font-medium text-sm lg:text-[15px] leading-snug line-clamp-2 text-gray-800 flex-1'>
          {data.name}
        </p>

        {/* Unit */}
        {data.unit && (
          <p className='text-[11px] text-gray-400'>{data.unit}</p>
        )}

        {/* Star Rating */}
        {data.avgRating > 0 && (
          <div className='flex items-center gap-1'>
            <div className='flex gap-0.5'>
              {[1,2,3,4,5].map(s => (
                s <= Math.round(data.avgRating)
                  ? <FaStar key={s} size={10} className='text-yellow-400' />
                  : <FaRegStar key={s} size={10} className='text-gray-300' />
              ))}
            </div>
            <span className='text-[10px] text-gray-500 font-medium'>{data.avgRating} ({data.reviewCount})</span>
          </div>
        )}

        {/* Price + Add */}
        <div className='flex items-center justify-between gap-2 mt-1'>
          <div>
            <p className='font-bold text-sm lg:text-base text-gray-900'>
              {DisplayPriceInRupees(discountedPrice)}
            </p>
            {data.discount > 0 && (
              <p className='text-[10px] text-gray-400 line-through leading-none'>
                {DisplayPriceInRupees(data.price)}
              </p>
            )}
          </div>
          <div className='w-20 flex-shrink-0'>
            {data.stock === 0 ? (
              <div className='bg-red-50 border border-red-200 text-red-600 text-[10px] font-extrabold text-center py-1.5 rounded-lg tracking-wide uppercase'>
                Sold Out
              </div>
            ) : (
              <AddToCartButton data={data} />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CardProduct
