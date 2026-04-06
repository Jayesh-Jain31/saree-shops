import React, { useState, useRef, useEffect } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import AddAddress from '../components/AddAddress'
import { useSelector } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { FaTag, FaTimes, FaCheckCircle, FaTruck, FaMapMarkerAlt } from 'react-icons/fa'
import { MdDeliveryDining, MdAccountBalanceWallet } from 'react-icons/md'
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
  const siteName = useSelector(state => state.site.name)
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem, fetchOrder } = useGlobalContext()
  const [openAddress, setOpenAddress] = useState(false)
  const [showAddressPopup, setShowAddressPopup] = useState(false)
  const addressList = useSelector(state => state.addresses.addressList)
  const [selectAddress, setSelectAddress] = useState(0)
  const cartItemsList = useSelector(state => state.cartItem.cart)
  const navigate = useNavigate()
  const addressSectionRef = useRef(null)
  const user = useSelector(state => state.user)

  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)

  const [codEnabled, setCodEnabled] = useState(true)

  const deliveryCharge = (() => {
    if (!deliveryInfo || !deliveryInfo.available || !deliveryInfo.deliveryCharge) return 0
    if (deliveryInfo.freeDeliveryAbove > 0 && totalPrice >= deliveryInfo.freeDeliveryAbove) return 0
    return deliveryInfo.deliveryCharge
  })()
  const baseAmount = appliedCoupon ? appliedCoupon.finalAmount : totalPrice
  const finalAmount = baseAmount + deliveryCharge
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0

  const walletDeduction = useWallet ? Math.min(walletBalance, finalAmount) : 0
  const payableAmount = finalAmount - walletDeduction

  useEffect(() => {
    if (!user?._id) return
    const fetchWallet = async () => {
      setWalletLoading(true)
      try {
        const res = await Axios({ ...SummaryApi.getWallet })
        if (res.data.success) {
          setWalletBalance(res.data.data.balance || 0)
        }
      } catch {}
      finally { setWalletLoading(false) }
    }
    fetchWallet()
  }, [user?._id])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          setCodEnabled(res.data.data.cod_enabled !== 'false')
        }
      } catch {}
    }
    fetchSettings()
  }, [])

  const checkDeliveryPincode = async (pincode) => {
    if (!pincode) return
    setDeliveryLoading(true)
    try {
      const response = await Axios({
        ...SummaryApi.checkPincode,
        data: { pincode }
      })
      if (response.data.success) {
        setDeliveryInfo(response.data.data)
      }
    } catch (error) {
      setDeliveryInfo(null)
    } finally {
      setDeliveryLoading(false)
    }
  }

  React.useEffect(() => {
    const selectedAddr = addressList[selectAddress]
    if (selectedAddr && selectedAddr.pincode) {
      checkDeliveryPincode(selectedAddr.pincode)
    } else {
      setDeliveryInfo(null)
    }
  }, [selectAddress, addressList])

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

  const debitWalletIfNeeded = async () => {
    if (!useWallet || walletDeduction <= 0) return true
    try {
      const res = await Axios({
        ...SummaryApi.debitWallet,
        data: { amount: walletDeduction, description: 'Order payment via wallet' }
      })
      if (res.data.success) {
        setWalletBalance(prev => prev - walletDeduction)
        return true
      }
      toast.error('Failed to debit wallet. Please try again.')
      return false
    } catch (err) {
      AxiosToastError(err)
      return false
    }
  }

  const handleCashOnDelivery = async () => {
    const selectedAddr = addressList[selectAddress]
    if (!selectedAddr?._id || !selectedAddr?.status) {
      setShowAddressPopup(true)
      return
    }

    const walletOk = await debitWalletIfNeeded()
    if (!walletOk) return

    try {
      const response = await Axios({
        ...SummaryApi.CashOnDeliveryOrder,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: payableAmount,
          discountAmt: couponDiscount,
        }
      })
      const { data: responseData } = response
      if (responseData.success) {
        const itemsSnapshot = [...cartItemsList]
        const selectedAddrSnapshot = addressList[selectAddress]
        toast.success(responseData.message)
        addNotification('Your Cash on Delivery order has been placed successfully!', 'success')
        if (fetchCartItem) fetchCartItem()
        if (fetchOrder) fetchOrder()
        navigate('/success', {
          state: {
            text: "Order",
            address: selectedAddrSnapshot,
            items: itemsSnapshot,
            totalAmount: payableAmount,
            deliveryCharge,
            paymentMethod: 'COD',
            estimatedDelivery: deliveryInfo?.estimatedTime,
            orderDate: new Date().toISOString(),
          }
        })
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleRazorpayPayment = async () => {
    const selectedAddr = addressList[selectAddress]
    if (!selectedAddr?._id || !selectedAddr?.status) {
      setShowAddressPopup(true)
      return
    }

    if (payableAmount <= 0) {
      const walletOk = await debitWalletIfNeeded()
      if (!walletOk) return
      try {
        const response = await Axios({
          ...SummaryApi.CashOnDeliveryOrder,
          data: {
            list_items: cartItemsList,
            addressId: addressList[selectAddress]?._id,
            subTotalAmt: totalPrice,
            totalAmt: 0,
            discountAmt: couponDiscount,
          }
        })
        if (response.data.success) {
          const itemsSnapshot = [...cartItemsList]
          const selectedAddrSnapshot = addressList[selectAddress]
          toast.success('Order placed using wallet balance!')
          addNotification('Your order has been placed using your wallet balance.', 'success')
          if (fetchCartItem) fetchCartItem()
          if (fetchOrder) fetchOrder()
          navigate('/success', {
            state: {
              text: "Order",
              address: selectedAddrSnapshot,
              items: itemsSnapshot,
              totalAmount: 0,
              deliveryCharge,
              paymentMethod: 'Wallet',
              estimatedDelivery: deliveryInfo?.estimatedTime,
              orderDate: new Date().toISOString(),
            }
          })
        }
      } catch (error) {
        AxiosToastError(error)
      }
      return
    }

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.')
        return
      }

      const configRes = await Axios({ url: '/api/config/razorpay-key', method: 'get' })
      const razorpayKeyId = configRes.data?.keyId

      if (!razorpayKeyId) {
        toast.error('Razorpay is not configured. Please contact support.')
        return
      }

      const toastId = toast.loading('Initializing payment...')

      const response = await Axios({
        ...SummaryApi.razorpayOrder,
        data: { totalAmt: payableAmount }
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
        name: siteName,
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            const walletOk = await debitWalletIfNeeded()
            if (!walletOk) return
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
              const itemsSnapshot = [...cartItemsList]
              const selectedAddrSnapshot = addressList[selectAddress]
              toast.success('Payment successful! Order placed.')
              addNotification('Your order has been placed successfully! Payment received via Razorpay.', 'success')
              if (fetchCartItem) fetchCartItem()
              if (fetchOrder) fetchOrder()
              navigate('/success', {
                state: {
                  text: "Order",
                  address: selectedAddrSnapshot,
                  items: itemsSnapshot,
                  totalAmount: payableAmount,
                  deliveryCharge,
                  paymentMethod: 'Razorpay',
                  estimatedDelivery: deliveryInfo?.estimatedTime,
                  orderDate: new Date().toISOString(),
                }
              })
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
        <div className='w-full' ref={addressSectionRef}>
          <h3 className='text-lg font-semibold'>Choose your address</h3>
          <div className='bg-white p-2 grid gap-4'>
            {addressList.map((address, index) => (
              <label key={index} htmlFor={"address" + index} className={!address.status ? "hidden" : ""}>
                <div className={`border rounded p-3 flex gap-3 cursor-pointer transition-colors ${String(selectAddress) === String(index) ? 'bg-blue-50 border-blue-400' : 'hover:bg-blue-50'}`}>
                  <div>
                    <input
                      id={"address" + index}
                      type='radio'
                      value={index}
                      checked={String(selectAddress) === String(index)}
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

          {deliveryLoading && (
            <div className='bg-gray-50 border rounded-lg p-3 flex items-center gap-2 mt-2'>
              <div className='w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
              <span className='text-sm text-gray-500'>Checking delivery availability...</span>
            </div>
          )}

          {!deliveryLoading && deliveryInfo && deliveryInfo.available && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3 mt-2 flex items-center gap-3'>
              <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <MdDeliveryDining className='text-green-600' size={22} />
              </div>
              <div>
                <p className='text-sm font-semibold text-green-800'>
                  Delivery in {deliveryInfo.estimatedTime}
                </p>
                <p className='text-xs text-green-600'>
                  {deliveryInfo.zoneName} — {deliveryCharge === 0
                    ? (deliveryInfo.freeDeliveryAbove > 0 && totalPrice >= deliveryInfo.freeDeliveryAbove
                      ? `Free delivery (above ₹${deliveryInfo.freeDeliveryAbove})`
                      : 'Free delivery')
                    : `₹${deliveryInfo.deliveryCharge} delivery charge`}
                </p>
                {deliveryInfo.freeDeliveryAbove > 0 && totalPrice < deliveryInfo.freeDeliveryAbove && (
                  <p className='text-[11px] text-green-500 mt-0.5'>
                    Add ₹{(deliveryInfo.freeDeliveryAbove - totalPrice).toFixed(0)} more for free delivery
                  </p>
                )}
              </div>
            </div>
          )}

          {!deliveryLoading && deliveryInfo && !deliveryInfo.available && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2 flex items-center gap-3'>
              <FaTruck className='text-yellow-500 flex-shrink-0' size={18} />
              <div>
                <p className='text-sm font-semibold text-yellow-800'>Standard delivery</p>
                <p className='text-xs text-yellow-600'>Express delivery not available for this pincode</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className='w-full max-w-md space-y-4'>

          {/* Wallet Section */}
          {walletBalance > 0 && (
            <div className='bg-white rounded-lg p-4 shadow-sm border border-green-100'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                    <MdAccountBalanceWallet className='text-green-600' size={20} />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-800'>{siteName} Wallet</p>
                    <p className='text-xs text-green-600 font-medium'>
                      Balance: {DisplayPriceInRupees(walletBalance)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUseWallet(p => !p)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${useWallet ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${useWallet ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              {useWallet && walletDeduction > 0 && (
                <div className='mt-3 bg-green-50 rounded-lg p-2.5 flex items-center justify-between'>
                  <p className='text-xs text-green-700 font-medium'>Wallet discount applied</p>
                  <p className='text-sm font-bold text-green-700'>- {DisplayPriceInRupees(walletDeduction)}</p>
                </div>
              )}
            </div>
          )}

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
                <p className='text-green-600 font-medium'>
                  {deliveryInfo && deliveryInfo.available && deliveryInfo.deliveryCharge > 0
                    ? DisplayPriceInRupees(deliveryInfo.deliveryCharge)
                    : 'Free'}
                </p>
              </div>
              {appliedCoupon && (
                <div className='flex justify-between text-green-600'>
                  <p>Coupon ({appliedCoupon.code})</p>
                  <p>- {DisplayPriceInRupees(couponDiscount)}</p>
                </div>
              )}
              {useWallet && walletDeduction > 0 && (
                <div className='flex justify-between text-green-600 font-medium'>
                  <p className='flex items-center gap-1'>
                    <MdAccountBalanceWallet size={14} /> Wallet Balance
                  </p>
                  <p>- {DisplayPriceInRupees(walletDeduction)}</p>
                </div>
              )}
              <div className='border-t pt-2 font-semibold flex items-center justify-between text-base'>
                <p>Grand Total</p>
                <div className='text-right'>
                  {useWallet && walletDeduction > 0 && (
                    <p className='text-xs line-through text-gray-400'>{DisplayPriceInRupees(finalAmount)}</p>
                  )}
                  <p className='text-green-700'>{DisplayPriceInRupees(Math.max(0, payableAmount))}</p>
                </div>
              </div>
              {(appliedCoupon || (useWallet && walletDeduction > 0)) && (
                <p className='text-green-600 text-xs text-right'>
                  Total savings: {DisplayPriceInRupees(couponDiscount + (notDiscountTotalPrice - totalPrice) + walletDeduction)}
                </p>
              )}
            </div>

            {/* Payment Buttons */}
            <div className='w-full flex flex-col gap-3 mt-5'>
              <button
                className='py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm'
                onClick={handleRazorpayPayment}
              >
                {payableAmount <= 0
                  ? 'Place Order (Fully from Wallet)'
                  : `Pay ${DisplayPriceInRupees(payableAmount)} with Razorpay`}
              </button>

              {codEnabled ? (
                <button
                  className='py-3 px-4 border-2 border-green-600 font-semibold text-green-600 hover:bg-green-600 hover:text-white active:scale-95 rounded-lg transition-all text-sm'
                  onClick={handleCashOnDelivery}
                >
                  {useWallet && walletDeduction > 0 && payableAmount > 0
                    ? `Pay ${DisplayPriceInRupees(payableAmount)} via COD + Wallet`
                    : 'Cash on Delivery'}
                </button>
              ) : (
                <div className='py-3 px-4 border-2 border-gray-200 rounded-lg text-center text-xs text-gray-400 bg-gray-50'>
                  Cash on Delivery is not available for this store
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {openAddress && (
        <AddAddress close={() => setOpenAddress(false)} />
      )}

      {/* Address Required Popup */}
      {showAddressPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
              <FaMapMarkerAlt className='text-red-500 text-2xl' />
            </div>
            <h2 className='text-lg font-bold text-gray-800 text-center'>Delivery Address Required</h2>
            <p className='text-sm text-gray-500 text-center'>
              Please select or add a delivery address before placing your order.
            </p>
            <div className='w-full flex flex-col gap-3 mt-2'>
              {addressList.filter(a => a.status).length > 0 ? (
                <button
                  onClick={() => {
                    setShowAddressPopup(false)
                    addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className='w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors'
                >
                  Select an Address
                </button>
              ) : null}
              <button
                onClick={() => {
                  setShowAddressPopup(false)
                  setOpenAddress(true)
                }}
                className='w-full py-3 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold rounded-xl transition-colors'
              >
                + Add New Address
              </button>
              <button
                onClick={() => setShowAddressPopup(false)}
                className='w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CheckoutPage
