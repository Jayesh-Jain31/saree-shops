import React, { useState, useRef, useEffect } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import BackButton from '../components/BackButton'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import AddAddress from '../components/AddAddress'
import { useSelector } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  FaTag, FaTimes, FaCheckCircle, FaMapMarkerAlt,
  FaPlus, FaMobileAlt, FaHome, FaBuilding
} from 'react-icons/fa'
import { MdAccountBalanceWallet, MdDeliveryDining } from 'react-icons/md'
import { GiDiamondTrophy } from 'react-icons/gi'
import { SiRazorpay } from 'react-icons/si'
import { addNotification } from '../components/NotificationBell'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/magic-checkout.js'
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
  const user = useSelector(state => state.user)

  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [useLoyalty, setUseLoyalty] = useState(false)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [codLoading, setCodLoading] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false)
  const [otpResendTimer, setOtpResendTimer] = useState(0)
  const [otpMobile, setOtpMobile] = useState('')
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const [activeCoupons, setActiveCoupons] = useState([])
  const [showCoupons, setShowCoupons] = useState(false)
  const siteSettings = useSelector(state => state.site.settings)
  const codEnabled = siteSettings?.cod_enabled !== 'false'

  const deliveryCharge = (() => {
    if (!deliveryInfo || !deliveryInfo.available || !deliveryInfo.deliveryCharge) return 0
    if (deliveryInfo.freeDeliveryAbove > 0 && totalPrice >= deliveryInfo.freeDeliveryAbove) return 0
    return deliveryInfo.deliveryCharge
  })()
  const baseAmount = appliedCoupon ? appliedCoupon.finalAmount : totalPrice
  const finalAmount = baseAmount + deliveryCharge
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const walletDeduction = useWallet ? Math.min(walletBalance, finalAmount) : 0
  const loyaltyPointsUsed = (() => {
    if (!useLoyalty || !loyaltyData) return 0
    const settings = loyaltyData.settings
    const maxByPct = Math.floor((finalAmount * settings.maxRedeemPct) / 100 / settings.pointValue)
    return Math.min(loyaltyData.points, maxByPct)
  })()
  const loyaltyDiscount = loyaltyPointsUsed > 0 ? parseFloat((loyaltyPointsUsed * (loyaltyData?.settings?.pointValue || 0)).toFixed(2)) : 0
  const payableAmount = Math.max(0, finalAmount - walletDeduction - loyaltyDiscount)
  const totalSavings = (notDiscountTotalPrice - totalPrice) + couponDiscount + walletDeduction + loyaltyDiscount

  useEffect(() => {
    if (!user?._id) return
    const fetchWallet = async () => {
      setWalletLoading(true)
      try {
        const res = await Axios({ ...SummaryApi.getWallet })
        if (res.data.success) setWalletBalance(res.data.data.balance || 0)
      } catch {} finally { setWalletLoading(false) }
    }
    const fetchLoyalty = async () => {
      setLoyaltyLoading(true)
      try {
        const res = await Axios({ ...SummaryApi.getMyLoyalty })
        if (res.data.success) setLoyaltyData(res.data.data)
      } catch {} finally { setLoyaltyLoading(false) }
    }
    fetchWallet()
    fetchLoyalty()
  }, [user?._id])

  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getActiveCoupons })
        if (res.data.success) setActiveCoupons(res.data.data || [])
      } catch {}
    }
    fetchActiveCoupons()
  }, [])

  // Auto-apply best eligible coupon
  useEffect(() => {
    if (!activeCoupons.length || appliedCoupon || totalPrice <= 0) return
    const eligible = activeCoupons.filter(c => !c.minOrderAmount || c.minOrderAmount <= totalPrice)
    if (!eligible.length) return
    const computeDiscount = (c) => {
      if (c.discountType === 'flat') return c.discountValue || 0
      if (c.discountType === 'percentage' || c.discountType === 'first_order') {
        const raw = (c.discountValue / 100) * totalPrice
        return c.maxDiscount ? Math.min(raw, c.maxDiscount) : raw
      }
      return 0
    }
    eligible.sort((a, b) => computeDiscount(b) - computeDiscount(a))
    const best = eligible[0]
    if (computeDiscount(best) > 0) {
      handleQuickApply(best.code)
    }
  }, [activeCoupons])


  const checkDeliveryPincode = async (pincode) => {
    if (!pincode) return
    setDeliveryLoading(true)
    try {
      const response = await Axios({ ...SummaryApi.checkPincode, data: { pincode } })
      if (response.data.success) setDeliveryInfo(response.data.data)
    } catch { setDeliveryInfo(null) }
    finally { setDeliveryLoading(false) }
  }

  useEffect(() => {
    const selectedAddr = addressList[selectAddress]
    if (selectedAddr?.pincode) checkDeliveryPincode(selectedAddr.pincode)
    else setDeliveryInfo(null)
  }, [selectAddress, addressList])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Please enter a coupon code'); return }
    setCouponLoading(true)
    try {
      const response = await Axios({ ...SummaryApi.validateCoupon, data: { code: couponCode.trim(), orderAmount: totalPrice } })
      if (response.data.success) { setAppliedCoupon(response.data.data); toast.success(response.data.message) }
    } catch (error) { AxiosToastError(error) }
    finally { setCouponLoading(false) }
  }

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode('') }

  const handleQuickApply = async (code) => {
    setCouponCode(code)
    setShowCoupons(false)
    setCouponLoading(true)
    try {
      const response = await Axios({ ...SummaryApi.validateCoupon, data: { code, orderAmount: totalPrice } })
      if (response.data.success) { setAppliedCoupon(response.data.data); toast.success(response.data.message) }
    } catch (error) { AxiosToastError(error) }
    finally { setCouponLoading(false) }
  }

  const describeCoupon = (c) => {
    if (c.discountType === 'percentage' || c.discountType === 'first_order') {
      const cap = c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''
      return `${c.discountValue}% off${cap}`
    }
    if (c.discountType === 'flat') return `₹${c.discountValue} off`
    if (c.discountType === 'free_shipping') return 'Free shipping'
    return `${c.discountValue}% off`
  }

  const debitWalletIfNeeded = async () => {
    if (!useWallet || walletDeduction <= 0) return true
    try {
      const res = await Axios({ ...SummaryApi.debitWallet, data: { amount: walletDeduction, description: 'Order payment via wallet' } })
      if (res.data.success) { setWalletBalance(prev => prev - walletDeduction); return true }
      toast.error('Failed to debit wallet. Please try again.'); return false
    } catch (err) { AxiosToastError(err); return false }
  }

  const startOtpResendTimer = () => {
    setOtpResendTimer(30)
    const interval = setInterval(() => {
      setOtpResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const placeCodOrder = async () => {
    const itemsSnapshot = [...cartItemsList]
    const selectedAddrSnapshot = addressList[selectAddress]
    const response = await Axios({
      ...SummaryApi.CashOnDeliveryOrder,
      data: { list_items: cartItemsList, addressId: addressList[selectAddress]?._id, subTotalAmt: totalPrice, deliveryCharge, totalAmt: payableAmount, discountAmt: couponDiscount, couponCode: appliedCoupon?.code || "", couponDiscount: couponDiscount, walletDeduction: walletDeduction, loyaltyPointsUsed: loyaltyPointsUsed, loyaltyDiscount: loyaltyDiscount }
    })
    if (response.data.success) {
      toast.success(response.data.message)
      addNotification('Your Cash on Delivery order has been placed successfully!', 'success')
      if (fetchCartItem) fetchCartItem()
      if (fetchOrder) fetchOrder()
      navigate('/success', { state: { text: "Order", address: selectedAddrSnapshot, items: itemsSnapshot, totalAmount: response.data.data?.totalAmt ?? payableAmount, deliveryCharge, paymentMethod: 'COD', estimatedDelivery: deliveryInfo?.estimatedTime, orderDate: new Date().toISOString() } })
    }
  }

  const handleCashOnDelivery = async () => {
    const selectedAddr = addressList[selectAddress]
    if (!selectedAddr?._id || !selectedAddr?.status) { setShowAddressPopup(true); return }
    const mobile = user?.mobile || selectedAddr?.mobile
    if (!mobile) {
      toast.error('Please add a mobile number to your profile to place a COD order.')
      return
    }
    setCodLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.sendCodOtp, data: { mobile } })
      if (res.data.success) {
        setOtpMobile(mobile)
        setOtpDigits(['', '', '', '', '', ''])
        setShowOtpModal(true)
        startOtpResendTimer()
        toast.success(res.data.message)
      } else {
        toast.error(res.data.message || 'Failed to send OTP')
      }
    } catch (error) { AxiosToastError(error) }
    finally { setCodLoading(false) }
  }

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const updated = [...otpDigits]
    updated[index] = value.slice(-1)
    setOtpDigits(updated)
    if (value && index < 5) otpRefs[index + 1]?.current?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus()
    }
  }

  const handleOtpVerify = async () => {
    const otp = otpDigits.join('')
    if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return }
    const walletOk = await debitWalletIfNeeded()
    if (!walletOk) return
    setOtpVerifyLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.verifyCodOtp, data: { mobile: otpMobile, otp } })
      if (res.data.success) {
        setShowOtpModal(false)
        await placeCodOrder()
      } else {
        toast.error(res.data.message || 'Invalid OTP. Please try again.')
      }
    } catch (error) { AxiosToastError(error) }
    finally { setOtpVerifyLoading(false) }
  }

  const handleOtpResend = async () => {
    if (otpResendTimer > 0) return
    try {
      const res = await Axios({ ...SummaryApi.resendCodOtp, data: { mobile: otpMobile } })
      if (res.data.success) { toast.success('OTP resent!'); startOtpResendTimer() }
      else toast.error(res.data.message || 'Failed to resend OTP')
    } catch (error) { AxiosToastError(error) }
  }

  const handleRazorpayPayment = async () => {
    const selectedAddr = addressList[selectAddress]
    if (!selectedAddr?._id || !selectedAddr?.status) { setShowAddressPopup(true); return }
    if (payableAmount <= 0) {
      const walletOk = await debitWalletIfNeeded()
      if (!walletOk) return
      try {
        const response = await Axios({
          ...SummaryApi.CashOnDeliveryOrder,
          data: { list_items: cartItemsList, addressId: addressList[selectAddress]?._id, subTotalAmt: totalPrice, deliveryCharge, totalAmt: 0, discountAmt: couponDiscount, couponCode: appliedCoupon?.code || "", couponDiscount: couponDiscount, walletDeduction: walletDeduction, loyaltyPointsUsed: loyaltyPointsUsed, loyaltyDiscount: loyaltyDiscount }
        })
        if (response.data.success) {
          const itemsSnapshot = [...cartItemsList]
          const selectedAddrSnapshot = addressList[selectAddress]
          toast.success('Order placed using wallet balance!')
          addNotification('Your order has been placed using your wallet balance.', 'success')
          if (fetchCartItem) fetchCartItem()
          if (fetchOrder) fetchOrder()
          navigate('/success', { state: { text: "Order", address: selectedAddrSnapshot, items: itemsSnapshot, totalAmount: response.data.data?.totalAmt ?? 0, deliveryCharge, paymentMethod: 'Wallet', estimatedDelivery: deliveryInfo?.estimatedTime, orderDate: new Date().toISOString() } })
        }
      } catch (error) { AxiosToastError(error) }
      return
    }
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) { toast.error('Failed to load Razorpay. Check your internet connection.'); return }
      const configRes = await Axios({ url: '/api/config/razorpay-key', method: 'get' })
      const razorpayKeyId = configRes.data?.keyId
      if (!razorpayKeyId) { toast.error('Razorpay is not configured. Please contact support.'); return }
      const toastId = toast.loading('Initializing payment...')
      const response = await Axios({ ...SummaryApi.razorpayOrder, data: { totalAmt: payableAmount, list_items: cartItemsList } })
      toast.dismiss(toastId)
      if (!response.data.success) { toast.error('Failed to create payment order.'); return }
      const razorpayOrder = response.data.data
      const selectedAddr = addressList[selectAddress]
      const customerMobile = user?.mobile || selectedAddr?.mobile || ''
      const customerName   = user?.name   || selectedAddr?.name   || ''
      const customerEmail  = user?.email  || ''

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: siteName,
        description: 'Order Payment',
        image: '/logo.png',
        order_id: razorpayOrder.id,

        // Magic Checkout — 1-click for returning Razorpay users
        one_click_checkout: true,
        show_coupons: true,

        // Pre-fill customer details
        prefill: {
          name:         customerName,
          email:        customerEmail,
          contact:      customerMobile ? `+91${String(customerMobile).replace(/\D/g, '').slice(-10)}` : '',
          coupon_code:  appliedCoupon?.code || '',
        },

        // Shipping address for Magic Checkout
        ...(selectedAddr && {
          customer_details: {
            name:    customerName,
            contact: customerMobile ? `+91${String(customerMobile).replace(/\D/g, '').slice(-10)}` : '',
            email:   customerEmail,
            shipping_address: {
              line1:   selectedAddr.address_line || '',
              line2:   selectedAddr.landmark     || '',
              city:    selectedAddr.city         || '',
              state:   selectedAddr.state        || '',
              zipcode: String(selectedAddr.pincode || ''),
              country: 'IN',
            }
          }
        }),

        // Show COD inside the Magic Checkout popup
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
            const itemsSnapshot        = [...cartItemsList]
            const selectedAddrSnapshot = addressList[selectAddress]

            // COD selected inside Magic Checkout popup
            if (paymentResponse.method === 'cod' || !paymentResponse.razorpay_signature) {
              const codToastId = toast.loading('Placing COD order...')
              const codRes = await Axios({
                ...SummaryApi.CashOnDeliveryOrder,
                data: { list_items: cartItemsList, addressId: selectedAddrSnapshot?._id, subTotalAmt: totalPrice, deliveryCharge, totalAmt: payableAmount, discountAmt: couponDiscount, couponCode: appliedCoupon?.code || '', couponDiscount, walletDeduction, loyaltyPointsUsed, loyaltyDiscount, razorpay_order_id: paymentResponse.razorpay_order_id || '' }
              })
              toast.dismiss(codToastId)
              if (codRes.data.success) {
                toast.success('COD order placed successfully!')
                addNotification('Your Cash on Delivery order has been placed!', 'success')
                if (fetchCartItem) fetchCartItem()
                if (fetchOrder) fetchOrder()
                navigate('/success', { state: { text: 'Order', address: selectedAddrSnapshot, items: itemsSnapshot, totalAmount: codRes.data.data?.totalAmt ?? payableAmount, deliveryCharge, paymentMethod: 'COD', estimatedDelivery: deliveryInfo?.estimatedTime, orderDate: new Date().toISOString() } })
              } else { toast.error('Failed to place COD order.') }
              return
            }

            // Online payment — verify signature
            const walletOk = await debitWalletIfNeeded()
            if (!walletOk) return
            const verifyToastId = toast.loading('Verifying payment...')
            const verifyRes = await Axios({
              ...SummaryApi.razorpayVerify,
              data: { razorpay_order_id: paymentResponse.razorpay_order_id, razorpay_payment_id: paymentResponse.razorpay_payment_id, razorpay_signature: paymentResponse.razorpay_signature, list_items: cartItemsList, addressId: selectedAddrSnapshot?._id, subTotalAmt: totalPrice, deliveryCharge, totalAmt: payableAmount, discountAmt: couponDiscount, couponCode: appliedCoupon?.code || "", couponDiscount: couponDiscount, walletDeduction: walletDeduction, loyaltyPointsUsed: loyaltyPointsUsed, loyaltyDiscount: loyaltyDiscount }
            })
            toast.dismiss(verifyToastId)
            if (verifyRes.data.success) {
              toast.success('Payment successful! Order placed.')
              addNotification('Your order has been placed successfully! Payment received via Razorpay.', 'success')
              if (fetchCartItem) fetchCartItem()
              if (fetchOrder) fetchOrder()
              navigate('/success', { state: { text: "Order", address: selectedAddrSnapshot, items: itemsSnapshot, totalAmount: verifyRes.data.data?.totalAmt ?? payableAmount, deliveryCharge, paymentMethod: 'Razorpay', estimatedDelivery: deliveryInfo?.estimatedTime, orderDate: new Date().toISOString() } })
            } else { toast.error('Payment verification failed.') }
          } catch (err) { toast.dismiss(); AxiosToastError(err) }
        },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => toast.error('Payment cancelled.'), escape: true }
      }
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) { toast.dismiss(); AxiosToastError(error) }
  }

  const activeAddresses = addressList.filter(a => a.status)

  return (
    <section className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-6 max-w-5xl'>

        <BackButton className='mb-4' />

        {/* Page Title */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Checkout</h1>
          <p className='text-sm text-gray-500 mt-0.5'>{totalQty} item{totalQty !== 1 ? 's' : ''} · {DisplayPriceInRupees(totalPrice)}</p>
        </div>

        <div className='flex flex-col lg:flex-row gap-5'>

          {/* ── Left Column ── */}
          <div className='flex-1 space-y-4'>

            {/* ── Delivery Address ── */}
            <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
              <div className='flex items-center justify-between px-5 py-4 border-b'>
                <div className='flex items-center gap-2.5'>
                  <div className='w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center'>
                    <FaMapMarkerAlt className='text-primary' size={14} />
                  </div>
                  <p className='font-bold text-gray-800'>Delivery Address</p>
                </div>
                <button
                  onClick={() => setOpenAddress(true)}
                  className='flex items-center gap-1.5 text-primary text-sm font-semibold hover:bg-primary/5 px-3 py-1.5 rounded-xl transition'>
                  <FaPlus size={11} /> Add New
                </button>
              </div>

              {activeAddresses.length === 0 ? (
                <div className='p-6 text-center'>
                  <p className='text-gray-500 text-sm'>No saved addresses. Please add one.</p>
                </div>
              ) : (
                <div className='p-4 space-y-2.5'>
                  {addressList.map((address, index) => {
                    if (!address.status) return null
                    const isSelected = String(selectAddress) === String(index)
                    return (
                      <label key={index} htmlFor={'address' + index} className='block cursor-pointer'>
                        <div className={`border-2 rounded-2xl p-4 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className='flex items-start gap-3'>
                            <input
                              id={'address' + index}
                              type='radio'
                              value={index}
                              checked={isSelected}
                              onChange={e => setSelectAddress(e.target.value)}
                              name='address'
                              className='mt-1 accent-primary flex-shrink-0'
                            />
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <FaHome size={11} className='text-gray-400' />
                                <p className='font-semibold text-gray-800 text-sm'>{address.address_line}</p>
                              </div>
                              <p className='text-xs text-gray-500 leading-relaxed'>
                                {address.city}, {address.state}, {address.country} — {address.pincode}
                              </p>
                              <div className='flex items-center gap-1 mt-1.5'>
                                <FaMobileAlt size={10} className='text-gray-400' />
                                <p className='text-xs text-gray-500'>{address.mobile}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <FaCheckCircle className='text-primary mt-0.5 flex-shrink-0' size={16} />
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Delivery Info */}
              {deliveryLoading && (
                <div className='mx-4 mb-4 bg-gray-50 border rounded-xl p-3 flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                  <span className='text-sm text-gray-500'>Checking delivery...</span>
                </div>
              )}
              {!deliveryLoading && deliveryInfo?.available && (
                <div className='mx-4 mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3'>
                  <MdDeliveryDining className='text-green-600 flex-shrink-0' size={22} />
                  <div>
                    <p className='text-sm font-semibold text-green-800'>Delivery in {deliveryInfo.estimatedTime}</p>
                    <p className='text-xs text-green-600'>
                      {deliveryInfo.zoneName}
                      {deliveryCharge === 0 ? ' · Free Delivery' : ` · ₹${deliveryInfo.deliveryCharge}`}
                    </p>
                    {deliveryInfo.freeDeliveryAbove > 0 && totalPrice < deliveryInfo.freeDeliveryAbove && (
                      <p className='text-[11px] text-green-500'>Add {DisplayPriceInRupees(deliveryInfo.freeDeliveryAbove - totalPrice)} for free delivery</p>
                    )}
                  </div>
                </div>
              )}
              {!deliveryLoading && deliveryInfo && !deliveryInfo.available && (
                <div className='mx-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2'>
                  <span className='text-yellow-500'>📦</span>
                  <p className='text-sm text-yellow-800 font-medium'>Standard delivery · charges may apply</p>
                </div>
              )}
            </div>

            {/* ── Wallet ── */}
            {walletBalance > 0 && (
              <div className='bg-white rounded-2xl border shadow-sm p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center'>
                      <MdAccountBalanceWallet className='text-green-600' size={20} />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-800 text-sm'>{siteName} Wallet</p>
                      <p className='text-xs text-green-600 font-medium'>Balance: {DisplayPriceInRupees(walletBalance)}</p>
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
                  <div className='mt-3 bg-green-50 rounded-xl p-2.5 flex items-center justify-between'>
                    <p className='text-xs text-green-700 font-medium'>✓ Wallet discount applied</p>
                    <p className='text-sm font-bold text-green-700'>- {DisplayPriceInRupees(walletDeduction)}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Loyalty Points ── */}
            {loyaltyData && loyaltyData.points >= (loyaltyData.settings?.minRedeem || 50) && (
              <div className='bg-white rounded-2xl border shadow-sm p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center'>
                      <GiDiamondTrophy className='text-yellow-600' size={20} />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-800 text-sm'>Loyalty Points</p>
                      <p className='text-xs text-yellow-600 font-medium'>
                        {loyaltyData.points} pts = {DisplayPriceInRupees(loyaltyData.rupeeValue)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseLoyalty(p => !p)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${useLoyalty ? 'bg-yellow-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${useLoyalty ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
                {useLoyalty && loyaltyDiscount > 0 && (
                  <div className='mt-3 bg-yellow-50 rounded-xl p-2.5 flex items-center justify-between'>
                    <p className='text-xs text-yellow-700 font-medium'>✓ {loyaltyPointsUsed} pts redeemed</p>
                    <p className='text-sm font-bold text-yellow-700'>- {DisplayPriceInRupees(loyaltyDiscount)}</p>
                  </div>
                )}
                {useLoyalty && loyaltyDiscount <= 0 && (
                  <p className='mt-2 text-xs text-gray-400'>Not enough redeemable points for this order amount.</p>
                )}
              </div>
            )}

            {/* ── Coupon ── */}
            <div className='bg-white rounded-2xl border shadow-sm p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <FaTag className='text-primary' size={14} />
                  <p className='font-bold text-gray-800 text-sm'>Apply Coupon</p>
                </div>
                {!appliedCoupon && activeCoupons.length > 0 && (
                  <button
                    onClick={() => setShowCoupons(v => !v)}
                    className='text-xs font-semibold text-primary hover:underline transition'
                  >
                    {showCoupons ? 'Hide offers' : `${activeCoupons.length} offer${activeCoupons.length > 1 ? 's' : ''} available`}
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className='flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3'>
                  <div className='flex items-center gap-2'>
                    <FaCheckCircle className='text-green-600' size={14} />
                    <div>
                      <p className='font-bold text-green-700 text-sm'>{appliedCoupon.code}</p>
                      <p className='text-xs text-green-600'>You saved {DisplayPriceInRupees(appliedCoupon.discountAmount)}!</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon}
                    className='w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition'>
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <div className='flex gap-2'>
                    <input
                      type='text' value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder='Enter coupon code'
                      className='flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase tracking-widest transition'
                    />
                    <button onClick={handleApplyCoupon} disabled={couponLoading}
                      className='btn-primary px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition'>
                      {couponLoading ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : 'Apply'}
                    </button>
                  </div>

                  {/* Available coupons list */}
                  {showCoupons && activeCoupons.length > 0 && (
                    <div className='mt-3 space-y-2'>
                      <p className='text-[11px] text-gray-400 font-medium uppercase tracking-wide'>Available Coupons</p>
                      {activeCoupons.map(c => {
                        const eligible = totalPrice >= (c.minOrderAmount || 0)
                        const shortfall = (c.minOrderAmount || 0) - totalPrice
                        return (
                          <div key={c._id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${eligible ? 'border-dashed border-primary/40 bg-primary/5' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <span className='font-bold text-xs tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md font-mono'>{c.code}</span>
                                <span className='text-xs font-semibold text-gray-700'>{describeCoupon(c)}</span>
                              </div>
                              {c.minOrderAmount > 0 && (
                                <p className='text-[10px] text-gray-400 mt-0.5'>
                                  {eligible ? `Min order ₹${c.minOrderAmount} ✓` : `Add ₹${shortfall} more to unlock`}
                                </p>
                              )}
                              {c.expiresAt && (
                                <p className='text-[10px] text-orange-400 mt-0.5'>
                                  Expires {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => eligible && handleQuickApply(c.code)}
                              disabled={!eligible || couponLoading}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${eligible ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                              Apply
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className='w-full lg:w-96 space-y-4'>

            {/* Bill Details */}
            <div className='bg-white rounded-2xl border shadow-sm p-5'>
              <p className='font-bold text-gray-800 mb-4'>Order Summary</p>
              <div className='space-y-3 text-sm'>
                <div className='flex justify-between text-gray-600'>
                  <span>Items ({totalQty})</span>
                  <div className='text-right'>
                    <span className='line-through text-gray-400 mr-2'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                    <span className='font-medium text-gray-800'>{DisplayPriceInRupees(totalPrice)}</span>
                  </div>
                </div>
                <div className='flex justify-between text-gray-600'>
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : 'text-gray-800'}>
                    {deliveryInfo?.available
                      ? (deliveryCharge === 0 ? 'FREE' : DisplayPriceInRupees(deliveryCharge))
                      : '—'}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className='flex justify-between text-green-600'>
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>- {DisplayPriceInRupees(couponDiscount)}</span>
                  </div>
                )}
                {useWallet && walletDeduction > 0 && (
                  <div className='flex justify-between text-green-600 font-medium'>
                    <span className='flex items-center gap-1'><MdAccountBalanceWallet size={14} /> Wallet</span>
                    <span>- {DisplayPriceInRupees(walletDeduction)}</span>
                  </div>
                )}
                {useLoyalty && loyaltyDiscount > 0 && (
                  <div className='flex justify-between text-yellow-600 font-medium'>
                    <span className='flex items-center gap-1'><GiDiamondTrophy size={14} /> Loyalty ({loyaltyPointsUsed} pts)</span>
                    <span>- {DisplayPriceInRupees(loyaltyDiscount)}</span>
                  </div>
                )}

                <div className='border-t border-gray-100 pt-3'>
                  <div className='flex justify-between font-bold text-gray-900 text-base'>
                    <span>Total Payable</span>
                    <span className='text-primary'>{DisplayPriceInRupees(Math.max(0, payableAmount))}</span>
                  </div>
                  {totalSavings > 0 && (
                    <p className='text-xs text-green-600 font-medium mt-1 text-right'>
                      🎉 Total savings: {DisplayPriceInRupees(totalSavings)}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Buttons */}
              <div className='mt-5 space-y-3'>
                <button
                  onClick={handleRazorpayPayment}
                  className='w-full bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl text-white font-bold transition-all py-4 flex items-center justify-center gap-2.5 text-sm'
                >
                  <SiRazorpay size={20} />
                  {payableAmount <= 0
                    ? 'Place Order (Fully Discounted)'
                    : `Pay ${DisplayPriceInRupees(payableAmount)} with Razorpay`}
                </button>

                {codEnabled ? (
                  <button
                    onClick={handleCashOnDelivery}
                    disabled={codLoading}
                    className='w-full border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-95 rounded-xl font-bold transition-all py-4 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {codLoading ? (
                      <>
                        <svg className='animate-spin h-5 w-5' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'/>
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      (useWallet && walletDeduction > 0) || (useLoyalty && loyaltyDiscount > 0)
                        ? `Pay ${DisplayPriceInRupees(payableAmount)} via COD`
                        : '🚚 Cash on Delivery'
                    )}
                  </button>
                ) : (
                  <div className='w-full border-2 border-gray-200 rounded-xl py-3 text-center text-xs text-gray-400 bg-gray-50'>
                    Cash on Delivery is not available
                  </div>
                )}
              </div>

              <p className='text-[11px] text-gray-400 text-center mt-3'>
                Secured by Razorpay · 100% payment protection
              </p>
            </div>

            {/* Cart Items Preview */}
            <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
              <p className='px-4 py-3 font-bold text-gray-800 text-sm border-b'>Items in Order</p>
              <div className='divide-y max-h-72 overflow-y-auto'>
                {cartItemsList.map((item, i) => (
                  <div key={i} className='flex items-center gap-3 px-4 py-3'>
                    <div className='w-12 h-12 rounded-xl bg-gray-50 border overflow-hidden flex-shrink-0'>
                      <img src={item?.productId?.image?.[0]} alt='' className='w-full h-full object-contain p-0.5' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-medium text-gray-800 line-clamp-1'>{item?.productId?.name}</p>
                      <p className='text-xs text-gray-500'>Qty: {item?.quantity}</p>
                    </div>
                    <p className='text-xs font-bold text-gray-900 flex-shrink-0'>
                      {DisplayPriceInRupees(item?.productId?.price * item?.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {openAddress && <AddAddress close={() => setOpenAddress(false)} />}

      {showAddressPopup && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
              <FaMapMarkerAlt className='text-red-500 text-2xl' />
            </div>
            <h2 className='text-lg font-bold text-gray-800 text-center'>Delivery Address Required</h2>
            <p className='text-sm text-gray-500 text-center'>Please select or add a delivery address before placing your order.</p>
            <div className='w-full flex flex-col gap-3 mt-2'>
              {activeAddresses.length > 0 ? (
                <button
                  onClick={() => { setShowAddressPopup(false); document.getElementById('address0')?.click() }}
                  className='w-full btn-primary py-3 rounded-xl font-semibold text-sm'>
                  Select Existing Address
                </button>
              ) : null}
              <button
                onClick={() => { setShowAddressPopup(false); setOpenAddress(true) }}
                className='w-full border-2 border-primary text-primary py-3 rounded-xl font-semibold text-sm hover:bg-primary/5 transition'>
                + Add New Address
              </button>
              <button onClick={() => setShowAddressPopup(false)} className='text-gray-400 text-sm hover:text-gray-600'>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showOtpModal && (
        <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4'>
            <div className='w-14 h-14 bg-green-100 rounded-full flex items-center justify-center'>
              <FaMobileAlt className='text-green-600 text-2xl' />
            </div>
            <h2 className='text-lg font-bold text-gray-800'>Verify Your Mobile</h2>
            <p className='text-sm text-gray-500 text-center'>
              We sent a 6-digit OTP to <span className='font-semibold text-gray-700'>+91 {String(otpMobile).replace(/^91/, '')}</span>
            </p>
            <div className='flex gap-2 mt-1'>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type='text'
                  inputMode='numeric'
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigitChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className='w-10 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none focus:border-primary transition-colors'
                />
              ))}
            </div>
            <button
              onClick={handleOtpVerify}
              disabled={otpVerifyLoading || otpDigits.join('').length !== 6}
              className='w-full bg-primary text-white font-bold py-3 rounded-xl mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-all'
            >
              {otpVerifyLoading ? (
                <>
                  <svg className='animate-spin h-5 w-5' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'/>
                  </svg>
                  Verifying...
                </>
              ) : 'Verify & Place Order'}
            </button>
            <div className='text-sm text-gray-500'>
              {otpResendTimer > 0 ? (
                <span>Resend OTP in <span className='font-semibold text-primary'>{otpResendTimer}s</span></span>
              ) : (
                <button onClick={handleOtpResend} className='text-primary font-semibold hover:underline'>
                  Resend OTP
                </button>
              )}
            </div>
            <button
              onClick={() => setShowOtpModal(false)}
              className='text-xs text-gray-400 hover:text-gray-600 mt-1'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default CheckoutPage
