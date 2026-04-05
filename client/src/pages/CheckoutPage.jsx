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
import { FaTag, FaTimes, FaCheckCircle } from 'react-icons/fa'
import { addNotification } from '../components/NotificationBell'

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
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : totalPrice
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0

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
          discountAmt: couponDiscount,
        }
      })
      const { data: responseData } = response
      if (responseData.success) {
        toast.success(responseData.message)
        addNotification('Your Cash on Delivery order has been placed successfully!', 'success')
        if (fetchCartItem) fetchCartItem()
        if (fetchOrder) fetchOrder()
        navigate('/success', { state: { text: "Order" } })
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleRazorpayPayment = async () => {
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.')
        return
      }

      // Fetch the public key from backend
      const configRes = await Axios({ url: '/api/config/razorpay-key', method: 'get' })
      const razorpayKeyId = configRes.data?.keyId

      if (!razorpayKeyId) {
        toast.error('Razorpay is not configured. Please contact support.')
        return
      }

      const toastId = toast.loading('Initializing payment...')

      const response = await Axios({
        ...SummaryApi.razorpayOrder,
        data: { totalAmt: finalAmount }
      })

      toast.dismiss(toastId)

      const { data: responseData } = response
      if (!responseData.success) {
        toast.error('Failed to create payment order.')
        return
      }

      const razorpayOrder = responseData.data

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Blinkit',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            const verifyToastId = toast.loading('Verifying payment...')
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
                discountAmt: couponDiscount,
              }
            })
            toast.dismiss(verifyToastId)
            const { data: verifyData } = verifyRes
            if (verifyData.success) {
              toast.success('Payment successful! Order placed.')
              addNotification('Your order has been placed successfully! Payment received via Razorpay.', 'success')
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

        {/* Right panel */}
        <div className='w-full max-w-md space-y-4'>

          {/* Coupon Section */}
          <div className='bg-white rounded-lg p-4 shadow-sm'>
            <h3 className='text-base font-semibold mb-3 flex items-center gap-2'>
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
                  className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 uppercase tracking-widest'
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
            <h3 className='text-base font-semibold mb-3'>Bill Details</h3>
            <div className='space-y-2 text-sm'>
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
                  <p>Coupon ({appliedCoupon.code})</p>
                  <p>- {DisplayPriceInRupees(couponDiscount)}</p>
                </div>
              )}
              <div className='border-t pt-2 font-semibold flex items-center justify-between text-base'>
                <p>Grand Total</p>
                <p className='text-green-700'>{DisplayPriceInRupees(finalAmount)}</p>
              </div>
              {appliedCoupon && (
                <p className='text-green-600 text-xs text-right'>
                  Total savings: {DisplayPriceInRupees(couponDiscount + (notDiscountTotalPrice - totalPrice))}
                </p>
              )}
            </div>

            {/* Payment Buttons */}
            <div className='w-full flex flex-col gap-3 mt-5'>
              <button
                className='py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm'
                onClick={handleRazorpayPayment}
              >
                Pay with Razorpay
              </button>

              <button
                className='py-3 px-4 border-2 border-green-600 font-semibold text-green-600 hover:bg-green-600 hover:text-white active:scale-95 rounded-lg transition-all text-sm'
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
