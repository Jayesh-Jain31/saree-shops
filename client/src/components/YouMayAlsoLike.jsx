import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from './AddToCartButton'
import { FaStar } from 'react-icons/fa'

const YouMayAlsoLike = ({ productId }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    Axios({ ...SummaryApi.getRecommendations, url: `${SummaryApi.getRecommendations.url}/${productId}`, params: { limit: 8 } })
      .then(res => { if (res.data.success) setProducts(res.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return (
    <div className='mt-8 px-2'>
      <h2 className='text-lg font-bold text-gray-800 mb-4'>You May Also Like</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className='min-w-[160px] w-[160px] rounded-2xl bg-gray-100 animate-pulse h-52 flex-shrink-0' />
        ))}
      </div>
    </div>
  )

  if (!products.length) return null

  return (
    <div className='mt-8 px-2'>
      <h2 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
        <span className='text-primary'>✨</span> You May Also Like
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2">
        {products.map(product => {
          const discountedPrice = pricewithDiscount(product.price, product.discount)
          const hasDiscount = product.discount > 0
          const slug = product.name?.toLowerCase().replace(/\s+/g, '-')
          return (
            <Link
              key={product._id}
              to={`/product/${slug}-${product._id}`}
              className="w-44 sm:w-48 lg:w-56 flex-shrink-0 bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className='relative'>
                <div className="w-full aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={product.image?.[0]}
                    alt={product.name}
                    className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                  />
                </div>
                {hasDiscount && (
                  <span className='absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full'>
                    {product.discount}% off
                  </span>
                )}
              </div>
              <div className='p-2.5'>
                <p className='text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1'>{product.name}</p>
                {product.avgRating > 0 && (
                  <div className='flex items-center gap-0.5 mb-1'>
                    <FaStar size={9} className='text-yellow-400' />
                    <span className='text-[10px] text-gray-500'>{product.avgRating.toFixed(1)}</span>
                  </div>
                )}
                <div className='flex items-center gap-1 flex-wrap'>
                  <p className='text-sm font-black text-gray-800'>{DisplayPriceInRupees(discountedPrice)}</p>
                  {hasDiscount && <p className='text-[10px] text-gray-400 line-through'>{DisplayPriceInRupees(product.price)}</p>}
                </div>
               <div className="w-20 mt-2" onClick={e => e.preventDefault()}>
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
