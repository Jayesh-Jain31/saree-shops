import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { valideURLConvert } from '../utils/valideURLConvert'
import { FaHeart, FaHeartBroken } from 'react-icons/fa'
import toast from 'react-hot-toast'
import AddToCartButton from '../components/AddToCartButton'
import NoData from '../components/NoData'

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getWishlist })
      if (response.data.success) {
        setWishlist(response.data.data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleRemove = async (productId) => {
    try {
      const response = await Axios({ ...SummaryApi.toggleWishlist, data: { productId } })
      if (response.data.success) {
        toast.success('Removed from wishlist')
        fetchWishlist()
      }
    } catch (error) {
      toast.error('Failed to remove')
    }
  }

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-5xl mx-auto px-4 pt-4'>
        <BackButton />
      </div>
      <div className='bg-white border-b p-4'>
        <div className='max-w-3xl mx-auto flex items-center gap-3'>
          <div className='w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center'>
            <FaHeart className='text-red-500' size={18} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>My Wishlist</h1>
            <p className='text-xs text-gray-500'>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
      </div>

      <div className='max-w-3xl mx-auto p-4'>
        {wishlist.length === 0 && (
          <div className='mt-8'>
            <NoData />
            <p className='text-center text-gray-500 text-sm mt-3'>Your wishlist is empty</p>
          </div>
        )}

        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {wishlist.map((item) => {
            const product = item.productId
            if (!product) return null
            const url = `/product/${valideURLConvert(product.name)}-${product._id}`

            return (
              <div key={item._id} className='bg-white rounded-xl border overflow-hidden group relative'>
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(product._id) }}
                  className='absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors'
                >
                  <FaHeartBroken className='text-red-500' size={14} />
                </button>

                <Link to={url}>
                  <div className='h-32 sm:h-40 bg-gray-50 p-2 flex items-center justify-center'>
                    <img src={product.image?.[0]} alt={product.name} className='max-h-full object-contain' />
                  </div>
                  <div className='p-3'>
                    <p className='text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2'>
                      {product.name}
                    </p>
                    <p className='text-xs text-gray-400 mb-1'>{product.unit}</p>
                    <div className='flex items-center gap-2'>
                      <span className='font-bold text-green-700 text-sm'>
                        {DisplayPriceInRupees(pricewithDiscount(product.price, product.discount))}
                      </span>
                      {product.discount > 0 && (
                        <span className='text-xs text-gray-400 line-through'>
                          {DisplayPriceInRupees(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className='px-3 pb-3'>
                  {product.stock === 0 ? (
                    <p className='text-red-500 text-xs text-center py-1'>Out of stock</p>
                  ) : (
                    <AddToCartButton data={product} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Wishlist
