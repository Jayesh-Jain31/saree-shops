import React, { useState } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import AddAddress from '../components/AddAddress'
import { useSelector } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { FaTag, FaTimes, FaCheckCircle } from 'react-icons/fa'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const CheckoutPage = () => {
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem, fetchOrder } = useGlobalContext()
  const [openAddress, setOpenAddress] = useState(false)
  const addressList = useSelector(state => state.addresses.addressList)
  const [selectAddress, setSelectAddress] = useState(0)
  const cartItemsList = useSelector(state => state.cartItem.cart)
  const navigate = useNavigate()

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null) // { code, discountAmount, finalAmount }

  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : totalPrice
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    setCouponLoading(true)
    try {
      const response = await Axios({
        ...SummaryApi.validateCoupon,
        data: { code: couponCode.trim(), orderAmount: totalPrice }
      })
      const { data: responseData } = response
      if (responseData.success) {
        setAppliedCoupon(responseData.data)
        toast.success(responseData.message)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const handleCashOnDelivery = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.CashOnDeliveryOrder,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: finalAmount,
        }
      })

      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message)
        if (fetchCartItem) fetchCartItem()
        if (fetchOrder) fetchOrder()
        navigate('/success', { state: { text: "Order" } })
      }

    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleOnlinePayment = async () => {
    try {
      toast.loading("Loading...")
      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
      const stripePromise = await loadStripe(stripePublicKey)

      const response = await Axios({
        ...SummaryApi.payment_url,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: finalAmount,
        }
      })

      const { data: responseData } = response

      stripePromise.redirectToCheckout({ sessionId: responseData.id })

      if (fetchCartItem) fetchCartItem()
      if (fetchOrder) fetchOrder()
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleRazorpayPayment = async () => {
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        return
      }

      toast.loading('Initializing payment...')

      const response = await Axios({
        ...SummaryApi.razorpayOrder,
        data: { totalAmt: finalAmount }
      })

      toast.dismiss()

      const { data: responseData } = response
      if (!responseData.success) {
        toast.error('Failed to create payment order.')
        return
      }

      const razorpayOrder = responseData.data

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Blinkit',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            toast.loading('Verifying payment...')
            const verifyRes = await Axios({
              ...SummaryApi.razorpayVerify,
              data: {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                list_items: cartItemsList,
                addressId: addressList[selectAddress]?._id,
                subTotalAmt: totalPrice,
                totalAmt: finalAmount,
              }
            })
            toast.dismiss()
            const { data: verifyData } = verifyRes
            if (verifyData.success) {
              toast.success('Payment successful! Order placed.')
              if (fetchCartItem) fetchCartItem()
              if (fetchOrder) fetchOrder()
              navigate('/success', { state: { text: "Order" } })
            } else {
              toast.error('Payment verification failed.')
            }
          } catch (err) {
            toast.dismiss()
            AxiosToastError(err)
          }
        },
        prefill: {},
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => toast.error('Payment cancelled.')
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error) {
      toast.dismiss()
      AxiosToastError(error)
    }
  }

  return (
    <section className='bg-blue-50 min-h-screen'>
      <div className='container mx-auto p-4 flex flex-col lg:flex-row w-full gap-5 justify-between'>

        {/* Address section */}
        <div className='w-full'>
          <h3 className='text-lg font-semibold'>Choose your address</h3>
          <div className='bg-white p-2 grid gap-4'>
            {addressList.map((address, index) => (
              <label key={index} htmlFor={"address" + index} className={!address.status ? "hidden" : ""}>
                <div className='border rounded p-3 flex gap-3 hover:bg-blue-50 cursor-pointer'>
                  <div>
                    <input
                      id={"address" + index}
                      type='radio'
                      value={index}
                      onChange={(e) => setSelectAddress(e.target.value)}
                      name='address'
                    />
                  </div>
                  <div>
                    <p>{address.address_line}</p>
                    <p>{address.city}</p>
                    <p>{address.state}</p>
                    <p>{address.country} - {address.pincode}</p>
                    <p>{address.mobile}</p>
                  </div>
                </div>
              </label>
            ))}
            <div
              onClick={() => setOpenAddress(true)}
              className='h-16 bg-blue-50 border-2 border-dashed flex justify-center items-center cursor-pointer hover:bg-blue-100 transition-colors'
            >
              + Add address
            </div>
          </div>
        </div>

        {/* Summary section */}
        <div className='w-full max-w-md'>

          {/* Coupon Section */}
          <div className='bg-white rounded-lg p-4 mb-4 shadow-sm'>
            <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
              <FaTag className='text-green-600' />
              Apply Coupon
            </h3>

            {appliedCoupon ? (
              <div className='flex items-center justify-between bg-green-50 border border-green-300 rounded-lg p-3'>
                <div className='flex items-center gap-2'>
                  <FaCheckCircle className='text-green-600' />
                  <div>
                    <p className='font-semibold text-green-700'>{appliedCoupon.code}</p>
                    <p className='text-sm text-green-600'>
                      You saved {DisplayPriceInRupees(appliedCoupon.discountAmount)}!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className='text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors'
                  title='Remove coupon'
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder='Enter coupon code'
                  className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 uppercase'
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className='bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors'
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Bill Details */}
          <div className='bg-white py-4 px-4 rounded-lg shadow-sm'>
            <h3 className='text-lg font-semibold mb-3'>Summary</h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <p className='text-gray-600'>Items total</p>
                <p className='flex items-center gap-2'>
                  <span className='line-through text-neutral-400'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                  <span>{DisplayPriceInRupees(totalPrice)}</span>
                </p>
              </div>
              <div className='flex justify-between'>
                <p className='text-gray-600'>Quantity total</p>
                <p>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
              </div>
              <div className='flex justify-between'>
                <p className='text-gray-600'>Delivery Charge</p>
                <p className='text-green-600 font-medium'>Free</p>
              </div>
              {appliedCoupon && (
                <div className='flex justify-between text-green-600'>
                  <p>Coupon Discount ({appliedCoupon.code})</p>
                  <p>- {DisplayPriceInRupees(discount)}</p>
                </div>
              )}
              <div className='border-t pt-2 font-semibold flex items-center justify-between text-lg'>
                <p>Grand Total</p>
                <p>{DisplayPriceInRupees(finalAmount)}</p>
              </div>
              {appliedCoupon && (
                <p className='text-green-600 text-sm text-right'>
                  You're saving {DisplayPriceInRupees(discount + (notDiscountTotalPrice - totalPrice))} on this order!
                </p>
              )}
            </div>

            {/* Payment Buttons */}
            <div className='w-full flex flex-col gap-3 mt-5'>
              <button
                className='py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2'
                onClick={handleRazorpayPayment}
              >
                <img
                  src='https://razorpay.com/favicon.png'
                  alt='Razorpay'
                  className='w-5 h-5 rounded'
                  onError={(e) => e.target.style.display = 'none'}
                />
                Pay with Razorpay
              </button>

              <button
                className='py-3 px-4 bg-green-600 hover:bg-green-700 active:scale-95 rounded-lg text-white font-semibold transition-all'
                onClick={handleOnlinePayment}
              >
                Pay with Stripe (Card)
              </button>

              <button
                className='py-3 px-4 border-2 border-green-600 font-semibold text-green-600 hover:bg-green-600 hover:text-white active:scale-95 rounded-lg transition-all'
                onClick={handleCashOnDelivery}
              >
                Cash on Delivery
              </button>
            </div>
          </div>
        </div>
      </div>

      {openAddress && (
        <AddAddress close={() => setOpenAddress(false)} />
      )}
    </section>
  )
}

export default CheckoutPage
