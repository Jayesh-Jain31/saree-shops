import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaShoppingBag, FaTag, FaShoppingCart } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/empty_cart.webp'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { addNotification } from './NotificationBell'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const DisplayCartItem = ({ close }) => {
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem, fetchOrder } = useGlobalContext()
  const cartItem = useSelector(state => state.cartItem.cart)
  const user = useSelector(state => state.user)
  const addressList = useSelector(state => state.addresses.addressList)
  const siteName = useSelector(state => state.site.name)
  const navigate = useNavigate()
  const [payLoading, setPayLoading] = useState(false)

  const savings = notDiscountTotalPrice - totalPrice

  const handleCheckout = async () => {
    if (!user?._id) { toast('Please Login'); return }

    const activeAddresses = addressList.filter(a => a.status)
    if (!activeAddresses.length) {
      toast.error('Please add a delivery address first.')
      if (close) close()
      navigate('/dashboard/address')
      return
    }

    setPayLoading(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) { toast.error('Failed to load Razorpay. Check your internet.'); setPayLoading(false); return }

      const configRes = await Axios({ url: '/api/config/razorpay-key', method: 'get' })
      const razorpayKeyId = configRes.data?.keyId
      if (!razorpayKeyId) { toast.error('Payment not configured. Contact support.'); setPayLoading(false); return }

      const orderRes = await Axios({ ...SummaryApi.razorpayOrder, data: { totalAmt: totalPrice, list_items: cartItem } })
      if (!orderRes.data.success) { toast.error('Failed to create payment order.'); setPayLoading(false); return }

      const razorpayOrder = orderRes.data.data
      const defaultAddr = activeAddresses[0]
      const customerMobile = user?.mobile || defaultAddr?.mobile || ''
      const customerName   = user?.name   || defaultAddr?.name   || ''
      const customerEmail  = user?.email  || ''

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: siteName || 'Saree Shop',
        description: 'Order Payment',
        image: '/logo.png',
        order_id: razorpayOrder.id,
        magic: true,
        prefill: {
          name:    customerName,
          email:   customerEmail,
          contact: customerMobile ? `+91${String(customerMobile).replace(/\D/g, '').slice(-10)}` : '',
        },
        customer_details: {
          name:    customerName,
          contact: customerMobile ? `+91${String(customerMobile).replace(/\D/g, '').slice(-10)}` : '',
          email:   customerEmail,
          shipping_address: {
            line1:   defaultAddr.address_line || '',
            line2:   defaultAddr.landmark     || '',
            city:    defaultAddr.city         || '',
            state:   defaultAddr.state        || '',
            zipcode: String(defaultAddr.pincode || ''),
            country: 'IN',
          }
        },
        config: {
          display: {
            blocks: {
              cod: { name: 'Cash on Delivery', instruments: [{ method: 'cod' }] }
            },
            sequence: ['block.cod'],
            preferences: { show_default_blocks: true }
          }
        },
        handler: async (paymentResponse) => {
          try {
            const itemsSnapshot  = [...cartItem]
            const addrSnapshot   = defaultAddr

            if (paymentResponse.method === 'cod' || !paymentResponse.razorpay_signature) {
              const codToastId = toast.loading('Placing COD order...')
              const codRes = await Axios({
                ...SummaryApi.CashOnDeliveryOrder,
                data: { list_items: itemsSnapshot, addressId: addrSnapshot._id, subTotalAmt: totalPrice, totalAmt: totalPrice, discountAmt: 0, couponCode: '', couponDiscount: 0, walletDeduction: 0, loyaltyPointsUsed: 0, loyaltyDiscount: 0 }
              })
              toast.dismiss(codToastId)
              if (codRes.data.success) {
                toast.success('COD order placed!')
                addNotification('Your Cash on Delivery order has been placed!', 'success')
                if (fetchCartItem) fetchCartItem()
                if (fetchOrder) fetchOrder()
                if (close) close()
                navigate('/success', { state: { text: 'Order', address: addrSnapshot, items: itemsSnapshot, totalAmount: totalPrice, deliveryCharge: 0, paymentMethod: 'COD', orderDate: new Date().toISOString() } })
              } else { toast.error('Failed to place COD order.') }
              return
            }

            const verifyToastId = toast.loading('Verifying payment...')
            const verifyRes = await Axios({
              ...SummaryApi.razorpayVerify,
              data: { razorpay_order_id: paymentResponse.razorpay_order_id, razorpay_payment_id: paymentResponse.razorpay_payment_id, razorpay_signature: paymentResponse.razorpay_signature, list_items: itemsSnapshot, addressId: addrSnapshot._id, subTotalAmt: totalPrice, totalAmt: totalPrice, discountAmt: 0, couponCode: '', couponDiscount: 0, walletDeduction: 0, loyaltyPointsUsed: 0, loyaltyDiscount: 0 }
            })
            toast.dismiss(verifyToastId)
            if (verifyRes.data.success) {
              toast.success('Payment successful! Order placed.')
              addNotification('Your order has been placed successfully!', 'success')
              if (fetchCartItem) fetchCartItem()
              if (fetchOrder) fetchOrder()
              if (close) close()
              navigate('/success', { state: { text: 'Order', address: addrSnapshot, items: itemsSnapshot, totalAmount: totalPrice, deliveryCharge: 0, paymentMethod: 'Razorpay', orderDate: new Date().toISOString() } })
            } else { toast.error('Payment verification failed.') }
          } catch (err) { toast.dismiss(); AxiosToastError(err) }
        },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => { setPayLoading(false) }, escape: true }
      }

      setPayLoading(false)
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      setPayLoading(false)
      AxiosToastError(error)
    }
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
                {cartItem.map((item) => {
                  const discountedPrice = pricewithDiscount(item?.productId?.price, item?.productId?.discount)
                  return (
                    <div key={item?._id + 'cartItem'} className='flex items-center gap-3 p-3'>
                      <div className='w-16 h-16 min-w-16 rounded-xl overflow-hidden bg-gray-50 border flex-shrink-0'>
                        <img
                          src={item?.productId?.image?.[0]}
                          alt={item?.productId?.name}
                          className='w-full h-full object-contain p-1'
                        />
                      </div>
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

        {/* ── Footer: Checkout Button ── */}
        {cartItem.length > 0 && (
          <div className='px-4 py-4 border-t bg-white flex-shrink-0'>
            <button
              onClick={handleCheckout}
              disabled={payLoading}
              className='w-full btn-primary rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-98 transition-transform disabled:opacity-70'
            >
              <div className='text-left'>
                <p className='text-base font-bold'>{DisplayPriceInRupees(totalPrice)}</p>
                <p className='text-xs opacity-80'>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              </div>
              <div className='flex items-center gap-2'>
                <FaShoppingCart size={15} />
                <span>{payLoading ? 'Loading...' : 'Checkout'}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default DisplayCartItem
