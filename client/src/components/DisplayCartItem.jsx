import React, { useState, useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaShoppingBag, FaTag, FaShoppingCart, FaGift } from 'react-icons/fa'
import { MdAccountBalanceWallet } from 'react-icons/md'
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/empty_cart.webp'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const DisplayCartItem = ({ close }) => {
  const { notDiscountTotalPrice, totalPrice, totalQty } = useGlobalContext()
  const cartItem   = useSelector(state => state.cartItem.cart)
  const user       = useSelector(state => state.user)
  const navigate   = useNavigate()

  const [walletBalance, setWalletBalance] = useState(0)
  const [dataLoading, setDataLoading]     = useState(false)
  const [giftProgress, setGiftProgress]   = useState(null)

  const savings = notDiscountTotalPrice - totalPrice

  const walletDeduction   = Math.min(walletBalance, totalPrice)
  const loyaltyPointsUsed = 0
  const loyaltyDiscount   = 0
  const payableAmount     = Math.max(0, totalPrice - walletDeduction)

  // Fetch wallet when cart opens
  useEffect(() => {
    if (!user?._id) return
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const walletRes = await Axios({ ...SummaryApi.getWallet })
        if (walletRes.data.success) setWalletBalance(walletRes.data.data.balance || 0)
      } catch {}
      finally { setDataLoading(false) }
    }
    fetchData()
  }, [user?._id])

  // Fetch free gift progress whenever cart total changes
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getFreeGiftProgress, params: { cartAmount: totalPrice } })
        setGiftProgress(res.data.data || null)
      } catch { setGiftProgress(null) }
    }
    fetchProgress()
  }, [totalPrice])

  const handleCheckout = async () => {
    if (!user?._id) { toast('Please Login'); return }

    // Keep checkout logic in CheckoutPage. The previous cart-only Razorpay
    // flow opened a payment popup even when the wallet made the payable
    // amount zero and did not have the selected-address/full-wallet path.
    if (close) close()
    navigate('/checkout')
    return

  }

  return (
    <section className='fixed inset-0 bg-black/60 z-50 backdrop-blur-sm' onClick={close}>
      <div className='bg-white w-full max-w-sm min-h-screen max-h-screen ml-auto flex flex-col shadow-2xl' onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className='flex items-center justify-between px-5 py-4 border-b flex-shrink-0'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center'>
              <FaShoppingBag className='text-primary' size={16} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800 text-base leading-tight'>My Cart</h2>
              {cartItem.length > 0 && <p className='text-xs text-gray-500'>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>}
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

              {/* Free Gift Progress Bar */}
              {giftProgress && (
                <div className={`rounded-xl overflow-hidden border ${giftProgress.isQualified ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50' : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'}`}>
                  {giftProgress.isQualified ? (
                    /* Unlocked state */
                    <div className='p-3'>
                      <div className='flex items-center gap-2 mb-2'>
                        <FaGift className='text-rose-500 flex-shrink-0' size={14} />
                        <p className='text-xs font-bold text-rose-700 leading-tight'>🎉 Free Gift Unlocked!</p>
                      </div>
                      <div className='flex items-center gap-2.5'>
                        {giftProgress.productId?.image?.[0] && (
                          <div className='w-10 h-10 rounded-lg bg-white border border-rose-100 overflow-hidden flex-shrink-0'>
                            <img src={giftProgress.productId.image[0]} alt={giftProgress.productId.name} className='w-full h-full object-contain p-0.5' />
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs font-semibold text-gray-800 line-clamp-1'>{giftProgress.productId?.name}</p>
                          <p className='text-[10px] text-rose-500 font-medium mt-0.5'>Added to your order for free!</p>
                        </div>
                        <span className='flex-shrink-0 text-sm font-bold text-rose-600 bg-white border border-rose-200 px-2 py-0.5 rounded-lg'>FREE</span>
                      </div>
                      {/* Full progress bar */}
                      <div className='mt-2.5 h-1.5 bg-rose-100 rounded-full overflow-hidden'>
                        <div className='h-full bg-rose-500 rounded-full w-full transition-all duration-500' />
                      </div>
                    </div>
                  ) : (
                    /* Not yet unlocked — show progress toward threshold */
                    <div className='p-3'>
                      <div className='flex items-center gap-2 mb-2'>
                        <FaGift className='text-orange-400 flex-shrink-0' size={13} />
                        <p className='text-xs font-semibold text-orange-700 leading-tight'>
                          Add <span className='font-bold text-orange-800'>{DisplayPriceInRupees(giftProgress.shortfall)}</span> more to get a free gift!
                        </p>
                      </div>
                      {/* Progress bar track */}
                      <div className='h-2 bg-orange-100 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-500'
                          style={{ width: `${giftProgress.progress}%` }}
                        />
                      </div>
                      <div className='flex items-center gap-2 mt-2'>
                        {giftProgress.productId?.image?.[0] && (
                          <div className='w-8 h-8 rounded-lg bg-white border border-orange-100 overflow-hidden flex-shrink-0 opacity-60'>
                            <img src={giftProgress.productId.image[0]} alt={giftProgress.productId.name} className='w-full h-full object-contain p-0.5' />
                          </div>
                        )}
                        <p className='text-[10px] text-orange-600 line-clamp-1 flex-1'>
                          {giftProgress.productId?.name} · <span className='font-semibold'>₹0 after ₹{(giftProgress.minOrderAmount || 0).toLocaleString('en-IN')}</span>
                        </p>
                        <span className='flex-shrink-0 text-[10px] font-bold text-orange-500'>{giftProgress.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                {cartItem.map((item) => {
                  const basePrice = item?.variant?.price ?? item?.productId?.price ?? 0
                  const discountedPrice = pricewithDiscount(basePrice, item?.productId?.discount)
                  const variantName = item?.variant?.name || ''
                  return (
                    <div key={item?._id + 'cartItem'} className='flex items-center gap-3 p-3'>
                      <div className='w-16 h-16 min-w-16 rounded-xl overflow-hidden bg-gray-50 border flex-shrink-0'>
                        <img src={item?.variant?.image || item?.productId?.image?.[0]} alt={item?.productId?.name} className='w-full h-full object-contain p-1' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-800 line-clamp-2 leading-tight'>
                          {item?.productId?.name}
                          {variantName && (
                            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full font-medium ml-1">{variantName}</span>
                          )}
                        </p>
                        {item?.productId?.unit && !variantName && <p className='text-xs text-gray-400 mt-0.5'>{item?.productId?.unit}</p>}
                        <div className='flex items-center gap-1.5 mt-1'>
                          <p className='text-sm font-bold text-gray-900'>{DisplayPriceInRupees(discountedPrice)}</p>
                          {item?.productId?.discount > 0 && <p className='text-xs text-gray-400 line-through'>{DisplayPriceInRupees(basePrice)}</p>}
                        </div>
                      </div>
                      <div className='w-24 flex-shrink-0'>
                        <AddToCartButton data={{ ...item?.productId, variant: item?.variant, price: basePrice, stock: item?.productId?.stock }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Wallet (auto-applied) ── */}
              {user?._id && !dataLoading && walletBalance > 0 && (
                <div className='flex items-center justify-between rounded-xl px-4 py-3 border bg-green-50 border-green-200'>
                  <div className='flex items-center gap-2.5'>
                    <MdAccountBalanceWallet className='text-green-600' size={20} />
                    <div>
                      <p className='text-sm font-semibold text-gray-800'>Wallet Balance</p>
                      <p className='text-xs text-gray-500'>{DisplayPriceInRupees(walletBalance)} available</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold text-green-600'>-{DisplayPriceInRupees(walletDeduction)}</span>
                    <span className='text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full'>Auto</span>
                  </div>
                </div>
              )}

              {/* ── Bill Summary ── */}
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
                  {walletDeduction > 0 && (
                    <div className='flex justify-between text-blue-600'>
                      <span>Wallet</span>
                      <span>- {DisplayPriceInRupees(walletDeduction)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-gray-600'>
                    <span>Delivery</span>
                    <span className='text-green-600 font-medium'>Calculated at checkout</span>
                  </div>
                  <div className='border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900'>
                    <span>To Pay</span>
                    <span>{DisplayPriceInRupees(payableAmount)}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-full py-16 px-6'>
              <img src={imageEmpty} alt='Empty cart' className='w-48 object-contain mb-4 opacity-80' />
              <p className='text-gray-500 font-medium text-base mb-1'>Your cart is empty</p>
              <p className='text-gray-400 text-sm text-center mb-5'>Add items to get started</p>
              <Link onClick={close} to='/' className='btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm'>Shop Now</Link>
            </div>
          )}
        </div>

        {/* ── Footer: Checkout Button ── */}
        {cartItem.length > 0 && (
          <div className='px-4 py-4 border-t bg-white flex-shrink-0'>
            <button
              onClick={handleCheckout}
              className='w-full btn-primary rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-98 transition-transform disabled:opacity-70'
            >
              <div className='text-left'>
                <p className='text-base font-bold'>{DisplayPriceInRupees(payableAmount)}</p>
                <p className='text-xs opacity-80'>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              </div>
              <div className='flex items-center gap-2'>
                <FaShoppingCart size={15} />
                <span>Checkout</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default DisplayCartItem
