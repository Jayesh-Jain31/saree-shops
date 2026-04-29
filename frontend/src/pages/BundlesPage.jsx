import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
import { Link } from 'react-router-dom'
import { FaBoxOpen } from 'react-icons/fa'

const BundleCard = ({ bundle }) => {
  const originalTotal = bundle.products.reduce((acc, p) => {
    const product = p.productId
    if (!product) return acc
    return acc + ((product.price || 0) * (p.quantity || 1))
  }, 0)
  const discountAmt = bundle.discountType === 'flat'
    ? bundle.discountValue
    : Math.round(originalTotal * bundle.discountValue / 100)
  const finalPrice = Math.max(0, originalTotal - discountAmt)
  const pctOff = originalTotal > 0 ? Math.round((discountAmt / originalTotal) * 100) : 0

  return (
    <div className='bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow'>
      <div className='relative'>
        {bundle.image ? (
          <img src={bundle.image} alt={bundle.name} className='w-full h-40 object-cover' />
        ) : (
          <div className='w-full h-28 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center'>
            <FaBoxOpen className='text-purple-300' size={40} />
          </div>
        )}
        <span className='absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full'>
          {bundle.label || 'Bundle Deal'}
        </span>
        {pctOff > 0 && (
          <span className='absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full'>
            {pctOff}% off
          </span>
        )}
      </div>

      <div className='p-4'>
        <h3 className='font-bold text-gray-800 text-base'>{bundle.name}</h3>
        {bundle.description && <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>{bundle.description}</p>}

        <div className='mt-3 flex items-center gap-2'>
          <span className='text-xl font-black text-gray-800'>{DisplayPriceInRupees(finalPrice)}</span>
          {originalTotal > finalPrice && (
            <span className='text-sm text-gray-400 line-through'>{DisplayPriceInRupees(originalTotal)}</span>
          )}
          {discountAmt > 0 && (
            <span className='text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full'>
              Save {DisplayPriceInRupees(discountAmt)}
            </span>
          )}
        </div>

        <div className='mt-3 space-y-1.5'>
          <p className='text-[10px] font-bold text-gray-400 uppercase tracking-wide'>Includes</p>
          {bundle.products.map((p, i) => {
            const product = p.productId
            if (!product) return null
            const slug = product.name?.toLowerCase().replace(/\s+/g, '-')
            const discountedPrice = pricewithDiscount(product.price, product.discount)
            return (
              <Link key={i} to={`/product/${slug}-${product._id}`}
                className='flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition'>
                <img src={product.image?.[0]} alt={product.name} className='w-10 h-10 rounded-lg object-cover border flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-medium text-gray-700 truncate'>{product.name}</p>
                  <p className='text-xs text-gray-500'>{DisplayPriceInRupees(discountedPrice)} × {p.quantity}</p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className='mt-4 grid grid-cols-1 gap-2'>
          {bundle.products.map((p, i) => {
            const product = p.productId
            if (!product) return null
            return (
              <div key={i} onClick={e => e.stopPropagation()}>
                <p className='text-[10px] text-gray-400 mb-1'>{product.name?.slice(0, 30)}</p>
                <AddToCartButton data={{ ...product, quantity: p.quantity }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const BundlesPage = () => {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Axios({ ...SummaryApi.getBundles, params: { activeOnly: 'true' } })
      .then(res => { if (res.data.success) setBundles(res.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin' />
    </div>
  )

  return (
    <div className='min-h-screen bg-gray-50 py-6 px-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center gap-3 mb-6'>
          <FaBoxOpen className='text-purple-500' size={28} />
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>Bundle Deals</h1>
            <p className='text-sm text-gray-400'>Buy more, save more — curated combo sets</p>
          </div>
        </div>

        {!bundles.length ? (
          <div className='text-center py-16 text-gray-400'>
            <FaBoxOpen size={56} className='mx-auto mb-4 opacity-20' />
            <p className='font-medium text-lg'>No bundles available right now</p>
            <p className='text-sm mt-1'>Check back soon for exciting combo offers!</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {bundles.map(bundle => <BundleCard key={bundle._id} bundle={bundle} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default BundlesPage
