import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import { MdAccessTime } from 'react-icons/md'

const RecentlyViewed = () => {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      setItems(stored)
    } catch (e) {}
  }, [])

  if (items.length === 0) return null

  return (
    <div className='container mx-auto px-4 my-4'>
      <div className='flex items-center gap-2 mb-3'>
        <MdAccessTime className='text-gray-500' size={18} />
        <h2 className='font-bold text-lg text-gray-800'>Recently Viewed</h2>
      </div>
      <div className='flex gap-3 overflow-x-auto scrollbar-none pb-2'>
        {items.map((item) => {
          const url = `/product/${valideURLConvert(item.name)}-${item._id}`
          return (
            <Link
              key={item._id}
              to={url}
              className='min-w-[130px] max-w-[130px] bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex-shrink-0'
            >
              <div className='h-24 bg-gray-50 p-2 flex items-center justify-center'>
                <img src={item.image} alt={item.name} className='max-h-full object-contain' />
              </div>
              <div className='p-2'>
                <p className='text-xs font-medium text-gray-700 line-clamp-2 leading-snug mb-1'>{item.name}</p>
                <p className='text-xs font-bold text-green-700'>
                  {DisplayPriceInRupees(pricewithDiscount(item.price, item.discount))}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RecentlyViewed
