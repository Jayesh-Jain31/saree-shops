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
import AxiosToastError from '../utils/AxiosToastError'
import { addNotification } from './NotificationBell'

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

const DisplayCartItem = ({ close }) => {
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem, fetchOrder } = useGlobalContext()
  const cartItem   = useSelector(state => state.cartItem.cart)
  const user       = useSelector(state => state.user)
  const addressList = useSelector(state => state.addresses.addressList)
  const siteName   = useSelector(state => state.site.name)
  const navigate   = useNavigate()

  const [payLoading, setPayLoading]       = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet]         = useState(false)
  const [loyaltyData, setLoyaltyData]     = useState(null)
  const [useLoyalty, setUseLoyalty]       = useState(false)
  const [dataLoading, setDataLoading]     = useState(false)

  const savings = notDiscountTotalPrice - totalPrice

  // Wallet deduction
  const walletDeduction = useWallet ? Math.min(walletBalance, totalPrice) : 0

  // Loyalty deduction
  const loyaltyPointsUsed = (() => {
    if (!useLoyalty || !loyaltyData) return 0
    const { pointValue, maxRedeemPct } = loyaltyData.settings
    const base     = totalPrice - walletDeduction
    const maxByPct = Math.floor((base * maxRedeemPct) / 100 / pointValue)
    return Math.min(loyaltyData.points, maxByPct)
  })()
  const loyaltyDiscount = loyaltyPointsUsed > 0
    ? parseFloat((loyaltyPointsUsed * (loyaltyData?.settings?.pointValue || 0)).toFixed(2))
    : 0

  const payableAmount = Math.max(0, totalPrice - walletDeduction - loyaltyDiscount)

  // Fetch wallet & loyalty when cart opens
  useEffect(() => {
    if (!user?._id) return
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [walletRes, loyaltyRes] = await Promise.all([
          Axios({ ...SummaryApi.getWallet }),
          Axios({ ...SummaryApi.getMyLoyalty }),
        ])
        if (walletRes.data.success) {
          const bal = walletRes.data.data.balance || 0
          setWalletBalance(bal)
          if (bal > 0) setUseWallet(true)
        }
        if (loyaltyRes.data.success) {
          setLoyaltyData(loyaltyRes.data.data)
          if ((loyaltyRes.data.data.points || 0) > 0) setUseLoyalty(true)
        }
      } catch {}
      finally { setDataLoading(false) }
    }
    fetchData()
  }, [user?._id])

  const handleCheckout = async () => {
    if (!user?._id) { toast('Please Login'); return }
    const activeAddresses = addressList.filter(a => a.status)
    if (!activeAddresses.length) {
      toast.error('Please add a delivery address first.')
      if (close) close()
      navigate('/dashboard/address')
      return
    }

    // Fully covered by wallet/points — place free order directly
    if (payableAmount <= 0) {
      setPayLoading(true)
      try {
        const defaultAddr = activeAddresses[0]
        const res = await Axios({
          ...SummaryApi.CashOnDeliveryOrder,
          data: {
            list_items: cartItem,
            addressId: defaultAddr._id,
            subTotalAmt: totalPrice,
            totalAmt: 0,
            walletDeduction,
            loyaltyPointsUsed,
            loyaltyDiscount,
          }
        })
        if (res.data.success) {
          toast.success('Order placed using wallet/points!')
          addNotification('Your order has been placed using wallet/loyalty points!', 'success')
          if (fetchCartItem) fetchCartItem()
          if (fetchOrder) fetchOrder()
          if (close) close()
          navigate('/success', { state: { text: 'Order', address: defaultAddr, items: cartItem, totalAmount: 0, deliveryCharge: 0, paymentMethod: 'Wallet', orderDate: new Date().toISOString() } })
        }
      } catch (err) { AxiosToastError(err) }
      finally { setPayLoading(false) }
      return
    }

    setPayLoading(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) { toast.error('Failed to load Razorpay.'); setPayLoading(false); return }

      const configRes = await Axios({ url: '/api/config/razorpay-key', method: 'get' })
      const razorpayKeyId = configRes.data?.keyId
      if (!razorpayKeyId) { toast.error('Payment not configured.'); setPayLoading(false); return }

      const orderRes = await Axios({ ...SummaryApi.razorpayOrder, data: { totalAmt: payableAmount, list_items: cartItem } })
      if (!orderRes.data.success) { toast.error('Failed to create payment order.'); setPayLoading(false); return }

      const razorpayOrder  = orderRes.data.data
      const defaultAddr    = activeAddresses[0]
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
            blocks: { cod: { name: 'Cash on Delivery', instruments: [{ method: 'cod' }] } },
            sequence: ['block.cod'],
            preferences: { show_default_blocks: true }
          }
        },
        handler: async (paymentResponse) => {
          try {
            const itemsSnapshot = [...cartItem]
            const addrSnapshot  = defaultAddr
            const orderData = {
              list_items: itemsSnapshot,
              addressId: addrSnapshot._id,
              subTotalAmt: totalPrice,
              totalAmt: payableAmount,
              walletDeduction,
              loyaltyPointsUsed,
              loyaltyDiscount,
            }

            if (paymentResponse.method === 'cod' || !paymentResponse.razorpay_signature) {
              const codToastId = toast.loading('Placing COD order...')
              const codRes = await Axios({ ...SummaryApi.CashOnDeliveryOrder, data: orderData })
              toast.dismiss(codToastId)
              if (codRes.data.success) {
                toast.success('COD order placed!')
                addNotification('Your Cash on Delivery order has been placed!', 'success')
                if (fetchCartItem) fetchCartItem()
                if (fetchOrder) fetchOrder()
                if (close) close()
                navigate('/success', { state: { text: 'Order', address: addrSnapshot, items: itemsSnapshot, totalAmount: payableAmount, deliveryCharge: 0, paymentMethod: 'COD', orderDate: new Date().toISOString() } })
              } else { toast.error('Failed to place COD order.') }
              return
            }

            const verifyToastId = toast.loading('Verifying payment...')
            const verifyRes = await Axios({
              ...SummaryApi.razorpayVerify,
              data: {
                razorpay_order_id:  paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                ...orderData,
              }
            })
            toast.dismiss(verifyToastId)
            if (verifyRes.data.success) {
              toast.success('Payment successful! Order placed.')
              addNotification('Your order has been placed successfully!', 'success')
              if (fetchCartItem) fetchCartItem()
              if (fetchOrder) fetchOrder()
              if (close) close()
              navigate('/success', { state: { text: 'Order', address: addrSnapshot, items: itemsSnapshot, totalAmount: payableAmount, deliveryCharge: 0, paymentMethod: 'Razorpay', orderDate: new Date().toISOString() } })
            } else { toast.error('Payment verification failed.') }
          } catch (err) { toast.dismiss(); AxiosToastError(err) }
        },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => { setPayLoading(false) }, escape: true }
      }

      setPayLoading(false)
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) { setPayLoading(false); AxiosToastError(error) }
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
                        <img src={item?.productId?.image?.[0]} alt={item?.productId?.name} className='w-full h-full object-contain p-1' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-800 line-clamp-2 leading-tight'>{item?.productId?.name}</p>
                        {item?.productId?.unit && <p className='text-xs text-gray-400 mt-0.5'>{item?.productId?.unit}</p>}
                        <div className='flex items-center gap-1.5 mt-1'>
                          <p className='text-sm font-bold text-gray-900'>{DisplayPriceInRupees(discountedPrice)}</p>
                          {item?.productId?.discount > 0 && <p className='text-xs text-gray-400 line-through'>{DisplayPriceInRupees(item?.productId?.price)}</p>}
                        </div>
                      </div>
                      <div className='w-24 flex-shrink-0'>
                        <AddToCartButton data={item?.productId} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Wallet & Loyalty ── */}
              {user?._id && !dataLoading && (walletBalance > 0 || (loyaltyData?.points > 0)) && (
                <div className='space-y-2'>
                  {walletBalance > 0 && (
                    <div onClick={() => setUseWallet(v => !v)} className={`flex items-center justify-between rounded-xl px-4 py-3 border cursor-pointer transition-all ${useWallet ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className='flex items-center gap-2.5'>
                        <MdAccountBalanceWallet className={useWallet ? 'text-blue-600' : 'text-gray-400'} size={20} />
                        <div>
                          <p className='text-sm font-semibold text-gray-800'>Wallet Balance</p>
                          <p className='text-xs text-gray-500'>{DisplayPriceInRupees(walletBalance)} available</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {useWallet && <span className='text-xs font-bold text-blue-600'>-{DisplayPriceInRupees(walletDeduction)}</span>}
                        <div className={`w-10 h-5 rounded-full transition-all ${useWallet ? 'bg-blue-500' : 'bg-gray-300'} relative`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${useWallet ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </div>
                  )}
                  {loyaltyData?.points > 0 && (
                    <div onClick={() => setUseLoyalty(v => !v)} className={`flex items-center justify-between rounded-xl px-4 py-3 border cursor-pointer transition-all ${useLoyalty ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className='flex items-center gap-2.5'>
                        <FaGift className={useLoyalty ? 'text-yellow-600' : 'text-gray-400'} size={17} />
                        <div>
                          <p className='text-sm font-semibold text-gray-800'>Reward Points</p>
                          <p className='text-xs text-gray-500'>{loyaltyData.points} pts = {DisplayPriceInRupees(loyaltyData.rupeeValue || 0)}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {useLoyalty && loyaltyDiscount > 0 && <span className='text-xs font-bold text-yellow-600'>-{DisplayPriceInRupees(loyaltyDiscount)}</span>}
                        <div className={`w-10 h-5 rounded-full transition-all ${useLoyalty ? 'bg-yellow-400' : 'bg-gray-300'} relative`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${useLoyalty ? 'right-0.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </div>
                  )}
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
                  {loyaltyDiscount > 0 && (
                    <div className='flex justify-between text-yellow-600'>
                      <span>Reward Points ({loyaltyPointsUsed} pts)</span>
                      <span>- {DisplayPriceInRupees(loyaltyDiscount)}</span>
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
              disabled={payLoading}
              className='w-full btn-primary rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-98 transition-transform disabled:opacity-70'
            >
              <div className='text-left'>
                <p className='text-base font-bold'>{DisplayPriceInRupees(payableAmount)}</p>
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
