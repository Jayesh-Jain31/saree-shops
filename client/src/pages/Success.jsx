import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaCheckCircle, FaMapMarkerAlt, FaTruck, FaBox, FaCreditCard, FaTag } from 'react-icons/fa'
import { MdCreditCard, MdLocalShipping } from 'react-icons/md'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import TruckAnimation from '../components/TruckAnimation'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const Success = () => {
  const location = useLocation()
  const state = location.state || {}

  const [serverOrder, setServerOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getOrderItems })
        const orders = res.data?.data || []
        if (orders.length > 0) {
          setServerOrder(orders[0])
        }
      } catch (e) {
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  const navItems   = state.items || []
  const navAddress = state.address

  const resolveAddress = () => {
    const snap = serverOrder?.delivery_address_snapshot
    if (snap && (snap.address_line || snap.name)) return snap
    return navAddress || null
  }

  const resolvePaymentMethod = () => {
    const status = serverOrder?.payment_status || ''
    if (status === 'CASH ON DELIVERY') return 'COD'
    if (status === 'PAID') return 'Online'
    if (status === 'WALLET') return 'Wallet'
    return state.paymentMethod || 'Online'
  }

  const address        = resolveAddress()
  const totalAmount    = serverOrder?.totalAmt    ?? state.totalAmount   ?? 0
  const deliveryCharge = serverOrder?.deliveryCharge ?? state.deliveryCharge ?? 0
  const subTotalAmt    = serverOrder?.subTotalAmt  ?? state.subTotalAmt  ?? 0
  const couponDiscount = serverOrder?.couponDiscount ?? state.couponDiscount ?? 0
  const couponCode     = serverOrder?.couponCode   ?? state.couponCode   ?? ''
  const paymentMethod  = resolvePaymentMethod()
  const orderDate      = serverOrder?.createdAt   || state.orderDate

  const items = navItems.length > 0 ? navItems : (serverOrder?.items || [])

  const hasDetails = address && items.length > 0

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const getExpectedDelivery = () => {
    if (state.estimatedDelivery) return state.estimatedDelivery
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return `By ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-3'></div>
          <p className='text-gray-500 text-sm'>Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-lg mx-auto'>

        <div className='text-center mb-6'>
          <TruckAnimation />
          <h1 className='text-2xl font-bold text-gray-800 mb-1 mt-2'>Order Placed!</h1>
          <p className='text-gray-500 text-sm'>Thank you! Your order has been confirmed.</p>
          {orderDate && (
            <p className='text-xs text-gray-400 mt-1'>
              {formatDate(orderDate)} at {formatTime(orderDate)}
            </p>
          )}
        </div>

        {hasDetails ? (
          <>
            {/* Delivery Info */}
            <div className='bg-white rounded-2xl border shadow-sm p-4 mb-4'>
              <div className='flex items-center gap-2 mb-3'>
                <FaTruck className='text-green-500' size={16} />
                <h2 className='font-bold text-sm text-gray-800'>Delivery Information</h2>
              </div>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <FaMapMarkerAlt className='text-gray-400 mt-0.5 flex-shrink-0' size={12} />
                  <div className='text-xs text-gray-600'>
                    {address.name && (
                      <p className='font-semibold text-gray-700 mb-0.5'>{address.name} · {address.mobile}</p>
                    )}
                    {!address.name && address.mobile && (
                      <p className='font-semibold text-gray-700 mb-0.5'>{address.mobile}</p>
                    )}
                    <p>{address.address_line}</p>
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    <p>{address.country}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2 pt-2 border-t'>
                  <MdLocalShipping className='text-green-500' size={14} />
                  <p className='text-xs text-green-700 font-semibold'>
                    Estimated Delivery: {getExpectedDelivery()}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Ordered */}
            <div className='bg-white rounded-2xl border shadow-sm p-4 mb-4'>
              <div className='flex items-center gap-2 mb-3'>
                <FaBox className='text-blue-500' size={14} />
                <h2 className='font-bold text-sm text-gray-800'>Items Ordered ({items.length})</h2>
              </div>
              <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
                {items.map((item, i) => {
                  const product = item.productId || {}
                  const img  = product?.image?.[0] || item.product_details?.image?.[0]
                  const name = product?.name || item.product_details?.name || 'Product'
                  const price = pricewithDiscount(product?.price || item.price || 0, product?.discount || 0)
                  const qty  = item.quantity || 1
                  return (
                    <div key={i} className='flex items-center gap-3 py-2 border-b last:border-0'>
                      {img && (
                        <img
                          src={img}
                          alt={name}
                          className='w-12 h-12 object-contain rounded-lg border bg-gray-50 flex-shrink-0'
                        />
                      )}
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium text-gray-700 line-clamp-2'>{name}</p>
                        <p className='text-[11px] text-gray-400 mt-0.5'>Qty: {qty}</p>
                      </div>
                      <p className='text-xs font-bold text-gray-700 flex-shrink-0'>
                        {DisplayPriceInRupees(price * qty)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Summary */}
            <div className='bg-white rounded-2xl border shadow-sm p-4 mb-6'>
              <div className='flex items-center gap-2 mb-3'>
                <MdCreditCard className='text-purple-500' size={16} />
                <h2 className='font-bold text-sm text-gray-800'>Payment Summary</h2>
              </div>
              <div className='space-y-1.5 text-xs'>
                <div className='flex justify-between text-gray-600'>
                  <span>Subtotal</span>
                  <span>{DisplayPriceInRupees(subTotalAmt || Math.max(0, totalAmount + couponDiscount - deliveryCharge))}</span>
                </div>
                <div className='flex justify-between text-gray-600'>
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryCharge === 0 ? 'FREE' : DisplayPriceInRupees(deliveryCharge)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className='flex justify-between text-green-600'>
                    <span className='flex items-center gap-1'>
                      <FaTag size={10} />
                      {couponCode ? `Coupon (${couponCode})` : 'Coupon Discount'}
                    </span>
                    <span className='font-semibold'>- {DisplayPriceInRupees(couponDiscount)}</span>
                  </div>
                )}
                <div className='flex justify-between font-bold text-gray-800 border-t pt-1.5 text-sm'>
                  <span>{paymentMethod === 'COD' ? 'Grand Total' : 'Total Paid'}</span>
                  <span>{DisplayPriceInRupees(totalAmount)}</span>
                </div>
                <div className='flex items-center gap-1.5 pt-1 text-gray-500'>
                  <FaCreditCard size={11} />
                  <span>
                    {paymentMethod === 'COD'
                      ? 'Cash on Delivery'
                      : paymentMethod === 'Wallet'
                      ? 'Paid via Wallet'
                      : `Paid via Razorpay`}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className='bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center'>
            <p className='text-green-700 text-sm font-medium'>
              Your order has been confirmed! You will receive updates soon.
            </p>
          </div>
        )}

        <Link
          to='/'
          className='block w-full text-center btn-primary font-semibold py-3.5 rounded-xl transition-all text-sm'
        >
          Go To Home
        </Link>
        <Link
          to='/dashboard/myorders'
          className='block w-full text-center border border-gray-300 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-all mt-3 text-sm'
        >
          View My Orders
        </Link>
      </div>
    </div>
  )
}

export default Success
