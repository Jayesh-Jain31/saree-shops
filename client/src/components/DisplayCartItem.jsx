import React from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaArrowRight, FaShoppingBag, FaTag } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/empty_cart.webp'
import toast from 'react-hot-toast'

const DisplayCartItem = ({ close }) => {
  const { notDiscountTotalPrice, totalPrice, totalQty } = useGlobalContext()
  const cartItem = useSelector(state => state.cartItem.cart)
  const user = useSelector(state => state.user)
  const navigate = useNavigate()

  const savings = notDiscountTotalPrice - totalPrice

  const redirectToCheckoutPage = () => {
    if (user?._id) {
      navigate('/checkout')
      if (close) close()
      return
    }
    toast('Please Login')
  }

  return (
    <section className='fixed inset-0 bg-black/60 z-50 backdrop-blur-sm' onClick={close}>
      <div
        className='bg-white w-full max-w-sm min-h-screen max-h-screen ml-auto flex flex-col shadow-2xl'
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className='flex items-center justify-between px-5 py-4 border-b flex-shrink-0'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center'>
              <FaShoppingBag className='text-primary' size={16} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800 text-base leading-tight'>My Cart</h2>
              {cartItem.length > 0 && (
                <p className='text-xs text-gray-500'>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button onClick={close} className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition'>
            <IoClose size={20} className='text-gray-500' />
          </button>
        </div>

        {/* ── Body ── */}
        <div className='flex-1 overflow-y-auto'>
          {cartItem.length > 0 ? (
            <div className='p-4 space-y-3'>

              {/* Savings Banner */}
              {savings > 0 && (
                <div className='flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5'>
                  <div className='flex items-center gap-2'>
                    <FaTag className='text-green-600' size={13} />
                    <p className='text-sm font-semibold text-green-700'>Your Savings</p>
                  </div>
                  <p className='text-sm font-bold text-green-700'>{DisplayPriceInRupees(savings)}</p>
                </div>
              )}

              {/* Cart Items */}
              <div className='bg-white border rounded-2xl overflow-hidden divide-y divide-gray-50'>
                {cartItem.map((item, index) => {
                  const discountedPrice = pricewithDiscount(item?.productId?.price, item?.productId?.discount)
                  return (
                    <div key={item?._id + 'cartItem'} className='flex items-center gap-3 p-3'>
                      {/* Image */}
                      <div className='w-16 h-16 min-w-16 rounded-xl overflow-hidden bg-gray-50 border flex-shrink-0'>
                        <img
                          src={item?.productId?.image?.[0]}
                          alt={item?.productId?.name}
                          className='w-full h-full object-contain p-1'
                        />
                      </div>

                      {/* Info */}
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-800 line-clamp-2 leading-tight'>{item?.productId?.name}</p>
                        {item?.productId?.unit && (
                          <p className='text-xs text-gray-400 mt-0.5'>{item?.productId?.unit}</p>
                        )}
                        <div className='flex items-center gap-1.5 mt-1'>
                          <p className='text-sm font-bold text-gray-900'>{DisplayPriceInRupees(discountedPrice)}</p>
                          {item?.productId?.discount > 0 && (
                            <p className='text-xs text-gray-400 line-through'>{DisplayPriceInRupees(item?.productId?.price)}</p>
                          )}
                        </div>
                      </div>

                      {/* Add to cart controls */}
                      <div className='w-24 flex-shrink-0'>
                        <AddToCartButton data={item?.productId} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bill Summary */}
              <div className='bg-gray-50 rounded-2xl p-4 space-y-2.5'>
                <p className='font-bold text-gray-800 text-sm'>Bill Summary</p>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between text-gray-600'>
                    <span>Items ({totalQty})</span>
                    <span>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                  </div>
                  {savings > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Product Discount</span>
                      <span>- {DisplayPriceInRupees(savings)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-gray-600'>
                    <span>Delivery</span>
                    <span className='text-green-600 font-medium'>Calculated at checkout</span>
                  </div>
                  <div className='border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900'>
                    <span>Subtotal</span>
                    <span>{DisplayPriceInRupees(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-full py-16 px-6'>
              <img src={imageEmpty} alt='Empty cart' className='w-48 object-contain mb-4 opacity-80' />
              <p className='text-gray-500 font-medium text-base mb-1'>Your cart is empty</p>
              <p className='text-gray-400 text-sm text-center mb-5'>Add items to get started</p>
              <Link onClick={close} to='/'
                className='btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm'>
                Shop Now
              </Link>
            </div>
          )}
        </div>

        {/* ── Footer: Proceed Button ── */}
        {cartItem.length > 0 && (
          <div className='px-4 py-4 border-t bg-white flex-shrink-0'>
            <button
              onClick={redirectToCheckoutPage}
              className='w-full btn-primary rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-98 transition-transform'
            >
              <div className='text-left'>
                <p className='text-base font-bold'>{DisplayPriceInRupees(totalPrice)}</p>
                <p className='text-xs opacity-80'>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              </div>
              <div className='flex items-center gap-2'>
                <span>Proceed</span>
                <FaArrowRight size={14} />
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default DisplayCartItem
