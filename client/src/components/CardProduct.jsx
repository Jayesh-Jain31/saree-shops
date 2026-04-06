import React from 'react'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from './AddToCartButton'

const CardProduct = ({ data }) => {
  const url = `/product/${valideURLConvert(data.name)}-${data._id}`

  return (
    <Link to={url} className='border rounded-xl bg-white flex flex-col overflow-hidden cursor-pointer hover:shadow-md transition-shadow w-36 lg:w-52 flex-shrink-0'>

      {/* Image — fixed square container so all products look uniform */}
      <div className='w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-2'>
        <img
          src={data.image[0]}
          alt={data.name}
          className='w-full h-full object-contain'
        />
      </div>

      {/* Badges */}
      <div className='flex items-center gap-1 px-2 pt-2 flex-wrap'>
        <span className='text-xs text-green-600 bg-green-50 rounded px-2 py-0.5'>10 min</span>
        {Boolean(data.discount) && (
          <span className='text-xs text-green-600 bg-green-100 rounded-full px-2 py-0.5'>
            {data.discount}% discount
          </span>
        )}
      </div>

      {/* Name */}
      <div className='px-2 pt-1 font-medium text-sm lg:text-base line-clamp-2 flex-1'>
        {data.name}
      </div>

      {/* Unit */}
      <div className='px-2 text-xs text-gray-500'>
        {data.unit}
      </div>

      {/* Low stock warning */}
      {data.stock > 0 && data.stock <= 5 && (
        <div className='px-2 mt-1'>
          <p className='text-orange-600 bg-orange-50 px-2 py-0.5 text-[10px] rounded-full w-fit font-semibold'>
            Only {data.stock} left!
          </p>
        </div>
      )}

      {/* Price + Add button */}
      <div className='px-2 pb-2 pt-1 flex items-center justify-between gap-1'>
        <span className='font-semibold text-sm lg:text-base'>
          {DisplayPriceInRupees(pricewithDiscount(data.price, data.discount))}
        </span>
        <div>
          {data.stock === 0 ? (
            <p className='text-red-500 text-xs text-center'>Out of stock</p>
          ) : (
            <AddToCartButton data={data} />
          )}
        </div>
      </div>

    </Link>
  )
}

export default CardProduct
