import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ProductQA from '../components/ProductQA'
import YouMayAlsoLike from '../components/YouMayAlsoLike'
import RecentlyViewed from '../components/RecentlyViewed'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleRight, FaAngleLeft, FaXmark } from "react-icons/fa6"
import {
  FaHeart, FaRegHeart,
  FaWhatsapp, FaLink, FaShareAlt,
  FaTruck, FaShieldAlt, FaMedal, FaBolt,
  FaMapMarkerAlt, FaCheckCircle, FaTimesCircle,
  FaPalette, FaStar, FaRegStar, FaBell, FaCheckDouble
} from 'react-icons/fa'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const addToRecentlyViewed = (product) => {
  try {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    const filtered = stored.filter(p => p._id !== product._id)
    filtered.unshift({
      _id: product._id, name: product.name,
      image: product.image?.[0], price: product.price, discount: product.discount, unit: product.unit,
    })
    localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)))
  } catch (e) {}
}


const TRUST_BADGES = [
  { icon: FaTruck,     label: 'Cash on Delivery', sub: 'Available',  bg: 'bg-green-50',  icon_color: 'text-green-600'  },
  { icon: FaShieldAlt, label: 'Secure Payment',   sub: '100% Safe',  bg: 'bg-blue-50',   icon_color: 'text-blue-600'   },
  { icon: FaMedal,     label: 'High Quality',      sub: 'Assured',    bg: 'bg-yellow-50', icon_color: 'text-yellow-600' },
  { icon: FaBolt,      label: 'Fast Delivery',     sub: 'On Time',    bg: 'bg-purple-50', icon_color: 'text-purple-600' },
]

const ProductDisplayPage = () => {
  const params = useParams()
  let productId = params?.product?.split("-")?.slice(-1)[0]
  const [data, setData] = useState({ name: "", image: [] })
  const [image, setImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const imageContainer = useRef()
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const lastTap = useRef(0)
  const lastTouches = useRef(null)
  const isPinching = useRef(false)
  const panStart = useRef(null)
  const user = useSelector(state => state?.user)

  const [wishlisted, setWishlisted] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [notifyRequested, setNotifyRequested] = useState(false)

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [ratingDist, setRatingDist] = useState({})

  const [viewingCount, setViewingCount] = useState(0)

  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState(null)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const siteSettings = useSelector(state => state.site.settings)
  const outsideDeliveryTime = siteSettings?.outside_delivery_time || '3-4 days'

  const fetchProductDetails = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getProductDetails, data: { productId } })
      if (response.data.success) {
        setData(response.data.data)
        addToRecentlyViewed(response.data.data)
      }
    } catch (error) { AxiosToastError(error) }
    finally { setLoading(false) }
  }

  const fetchReviewDist = async () => {
    try {
      const res = await Axios({ ...SummaryApi.getProductReviews, data: { productId } })
      if (res.data.success) {
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        ;(res.data.data?.reviews || []).forEach(r => {
          const star = Math.round(r.rating)
          if (star >= 1 && star <= 5) dist[star]++
        })
        setRatingDist(dist)
      }
    } catch {}
  }

  const checkWishlist = async () => {
    try {
      const res = await Axios({ ...SummaryApi.getWishlist })
      if (res.data.success) setWishlisted(res.data.data.some(w => w.productId?._id === productId))
    } catch (e) {}
  }

  useEffect(() => {
    if (!productId) return
    const seed = productId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const base = 8 + (seed % 16)
    setViewingCount(base)
    const iv = setInterval(() => {
      setViewingCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(4, Math.min(32, prev + delta))
      })
    }, 12000)
    return () => clearInterval(iv)
  }, [productId])

  useEffect(() => {
    setSelectedVariant(null)
    setRatingDist({})
    fetchProductDetails()
    fetchReviewDist()
    if (user?._id) checkWishlist()
  }, [params])

  useEffect(() => {
    if (!data.image || data.image.length <= 1) return
    const iv = setInterval(() => setImage(prev => (prev + 1) % data.image.length), 3500)
    return () => clearInterval(iv)
  }, [data.image])

  const handleCheckPincode = async () => {
    const cleaned = pincode.trim()
    if (!cleaned || cleaned.length < 6) { toast.error('Enter a valid 6-digit pincode'); return }
    setCheckingPincode(true)
    setPincodeResult(null)
    try {
      const res = await Axios({ ...SummaryApi.checkPincode, data: { pincode: cleaned } })
      if (res.data.success) setPincodeResult(res.data.data)
    } catch (e) {}
    setCheckingPincode(false)
  }

  const toggleWishlist = async () => {
    if (!user?._id) { toast.error('Please login first'); return }
    try {
      const res = await Axios({ ...SummaryApi.toggleWishlist, data: { productId: data._id } })
      if (res.data.success) { setWishlisted(res.data.data.added); toast.success(res.data.message) }
    } catch (error) { AxiosToastError(error) }
  }

  const handleNotifyMe = () => {
    if (!user?._id) { toast.error('Please login to get notified'); return }
    localStorage.setItem(`notify_stock_${data._id}`, '1')
    setNotifyRequested(true)
    toast.success("You'll be notified when it's back in stock!", { icon: '🔔' })
  }

  useEffect(() => {
    if (data._id) {
      setNotifyRequested(!!localStorage.getItem(`notify_stock_${data._id}`))
    }
  }, [data._id])

  const handleShare = (type) => {
    const url = window.location.href
    if (type === 'copy') { navigator.clipboard.writeText(url); toast.success('Link copied!') }
    else if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${data.name}: ${url}`)}`, '_blank')
    setShowShareMenu(false)
  }

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : pricewithDiscount(data.price, data.discount)

  const displayOriginalPrice = selectedVariant ? null : data.price
  const displayStock = selectedVariant ? selectedVariant.stock : data.stock
  const variants = data.variants || []

  return (
    <>
    <div className='container mx-auto px-4 pt-4'>
      <BackButton />
    </div>
    <section className='container mx-auto p-4 grid lg:grid-cols-2 lg:gap-8'>

      {/* ── Left: Images ── */}
      <div>
        <div className='bg-white rounded-2xl relative border overflow-hidden'>
          <img
            key={image}
            src={data.image[image]}
            className='w-full h-auto block cursor-zoom-in'
            style={{ animation: 'fadeSlideIn 0.35s ease' }}
            onClick={() => setLightboxOpen(true)}
          />
          {/* Wishlist + Share — float over top-right of image */}
          <div className='absolute top-3 right-3 flex gap-2 z-10'>
            <button onClick={toggleWishlist}
              className='w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border'>
              {wishlisted ? <FaHeart className='text-red-500' size={16} /> : <FaRegHeart className='text-gray-400' size={16} />}
            </button>
            <div className='relative'>
              <button onClick={() => setShowShareMenu(!showShareMenu)}
                className='w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border'>
                <FaShareAlt className='text-gray-500' size={14} />
              </button>
              {showShareMenu && (
                <div className='absolute right-0 top-11 bg-white border rounded-xl shadow-lg p-2 z-20 w-40'>
                  <button onClick={() => handleShare('whatsapp')} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm'>
                    <FaWhatsapp className='text-green-500' size={16} /> WhatsApp
                  </button>
                  <button onClick={() => handleShare('copy')} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm'>
                    <FaLink className='text-gray-500' size={14} /> Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Tap-to-zoom hint */}
          <div className='absolute bottom-10 right-3 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none'>
            Tap to zoom
          </div>
          {/* Dot indicators */}
          {data.image.length > 1 && (
            <div className='absolute bottom-2 left-0 right-0 flex justify-center gap-1.5'>
              {data.image.map((_, i) => (
                <button key={i} onClick={() => setImage(i)}
                  className={`rounded-full transition-all duration-300 ${i === image ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-gray-300'}`} />
              ))}
            </div>
          )}
        </div>

        <div className='grid relative mt-2'>
          <div ref={imageContainer} className='flex gap-2 z-10 relative w-full overflow-x-auto scrollbar-none'>
            {data.image.map((img, index) => (
              <button key={img + index} onClick={() => setImage(index)}
                className={`w-16 h-16 min-w-16 rounded-xl overflow-hidden border-2 transition-all ${index === image ? 'border-primary' : 'border-transparent'}`}>
                <img src={img} alt='' className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
          <div className='w-full -ml-3 h-full hidden lg:flex justify-between absolute items-center'>
            <button onClick={() => imageContainer.current.scrollLeft -= 80} className='z-10 bg-white p-1 rounded-full shadow-lg'><FaAngleLeft /></button>
            <button onClick={() => imageContainer.current.scrollLeft += 80} className='z-10 bg-white p-1 rounded-full shadow-lg'><FaAngleRight /></button>
          </div>
        </div>

        {/* Desktop description */}
        <div className='my-4 hidden lg:grid gap-3'>
          {data.description && (
            <div>
              <p className='font-semibold text-gray-700 mb-1'>Description</p>
              <p className='text-sm text-gray-600 leading-relaxed'>{data.description}</p>
            </div>
          )}
          {data.unit && (
            <div><p className='font-semibold text-gray-700'>Unit</p><p className='text-sm text-gray-600'>{data.unit}</p></div>
          )}
          {data?.more_details && Object.keys(data.more_details).map((el, i) => (
            <div key={i}><p className='font-semibold text-gray-700'>{el}</p><p className='text-sm text-gray-600'>{data.more_details[el]}</p></div>
          ))}
        </div>
      </div>

      {/* ── Right: Product Info ── */}
      <div className='pt-2 lg:pt-0'>

        {/* Name */}
        <h1 className='text-xl font-bold text-gray-900 lg:text-2xl leading-tight'>{data.name}</h1>
        {data.unit && <p className='text-sm text-gray-500 mt-0.5'>{data.unit}</p>}

        {/* Star Rating Display */}
        {data.avgRating > 0 && (
          <div className='mt-2 mb-1'>
            {/* Average row */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full'>
                <span>{data.avgRating}</span>
                <FaStar size={10} />
              </div>
              <div className='flex gap-0.5'>
                {[1,2,3,4,5].map(s => (
                  s <= Math.round(data.avgRating)
                    ? <FaStar key={s} size={13} className='text-yellow-400' />
                    : <FaRegStar key={s} size={13} className='text-gray-300' />
                ))}
              </div>
              <span className='text-xs text-gray-500 font-medium'>{data.reviewCount} rating{data.reviewCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Social proof — live viewing count */}
        {viewingCount > 0 && (
          <div className='flex items-center gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-full px-3 py-1 w-fit'>
            <span className='inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse'></span>
            <p className='text-xs text-red-600 font-semibold'>{viewingCount} people are viewing this right now</p>
          </div>
        )}

        <Divider />

        {/* ── Variant Selector ── */}
        {variants.length > 0 && (
          <div className='mb-3'>
            <div className='flex items-center gap-1.5 mb-2'>
              <FaPalette className='text-primary' size={12} />
              <p className='text-xs font-bold text-gray-600 uppercase tracking-wider'>Select Variant</p>
              {selectedVariant && <span className='text-xs text-primary font-semibold'>— {selectedVariant.name}</span>}
            </div>
            <div className='flex gap-2 flex-wrap'>
              {variants.map((v, i) => (
                <button key={i}
                  onClick={() => setSelectedVariant(selectedVariant?.name === v.name ? null : v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedVariant?.name === v.name
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 bg-white hover:border-primary/50'
                  }`}>
                  {v.name}
                  {v.price ? <span className='ml-1 text-xs opacity-80'>₹{v.price}</span> : ''}
                </button>
              ))}
            </div>
            {selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock <= 5 && (
              <p className='text-xs text-orange-600 mt-1.5'>Only {selectedVariant.stock} left in this variant</p>
            )}
          </div>
        )}

        {/* ── Price row + AddToCart (inline) ── */}
        <div className='flex items-end justify-between gap-3 mb-3 pr-3'>
          <div className='min-w-0 flex-1'>
            <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>Price</p>
            <span className='text-2xl font-bold text-gray-900 block leading-tight'>
              {DisplayPriceInRupees(displayPrice)}
            </span>
            {!selectedVariant && data.discount > 0 && (
              <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
                <span className='text-sm text-gray-400 line-through'>{DisplayPriceInRupees(data.price)}</span>
                <span className='bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full'>{data.discount}% OFF</span>
              </div>
            )}
          </div>

          {/* AddToCart on the right of price */}
          <div className='w-28 flex-shrink-0'>
            {displayStock !== 0 && <AddToCartButton data={data} />}
          </div>
        </div>

        {/* Out of Stock + Notify Me */}
        {displayStock === 0 && (
          <div className='mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-4'>
            <div className='flex items-center gap-2 mb-3'>
              <span className='text-2xl'>🚫</span>
              <div>
                <p className='text-red-700 font-extrabold text-base uppercase tracking-wide'>Out of Stock</p>
                <p className='text-red-500 text-xs'>This item is currently unavailable</p>
              </div>
            </div>
            {notifyRequested ? (
              <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2'>
                <FaCheckDouble className='text-green-500' size={14} />
                <p className='text-green-700 text-sm font-semibold'>You're on the notify list! We'll let you know.</p>
              </div>
            ) : (
              <button
                onClick={handleNotifyMe}
                className='flex items-center gap-2 bg-white border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 font-bold text-sm px-4 py-2 rounded-xl transition-all active:scale-95 w-full justify-center'
              >
                <FaBell size={14} className='animate-bounce' />
                Notify Me When Back in Stock
              </button>
            )}
          </div>
        )}

        {/* Stock Warning */}
        {displayStock > 0 && displayStock <= 5 && (
          <div className='mb-3 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm text-orange-700 font-medium flex items-center gap-2'>
            <span>⚡</span> Hurry! Only {displayStock} left
          </div>
        )}

        {/* ── Pincode Checker ── */}
        <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4'>
          <div className='flex items-center gap-2 mb-3'>
            <FaMapMarkerAlt className='text-primary' size={14} />
            <p className='font-semibold text-gray-800 text-sm'>Check Delivery for Your Area</p>
          </div>
          <div className='flex gap-2'>
            <input
              type='number'
              value={pincode}
              onChange={e => { setPincode(e.target.value); setPincodeResult(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCheckPincode()}
              maxLength={6}
              placeholder='Enter 6-digit pincode'
              className='flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
            />
            <button onClick={handleCheckPincode} disabled={checkingPincode}
              className='btn-primary px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all'>
              {checkingPincode
                ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                : 'CHECK'}
            </button>
          </div>
          {pincodeResult && (
            <div className={`mt-3 rounded-xl px-4 py-3 flex items-start gap-2.5 ${pincodeResult.available ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              {pincodeResult.available ? (
                <>
                  <FaCheckCircle className='text-green-500 mt-0.5 flex-shrink-0' size={15} />
                  <div>
                    <p className='text-sm font-semibold text-green-700'>Delivery Available!</p>
                    <p className='text-xs text-green-600 mt-0.5'>
                      Estimated: <strong>{pincodeResult.estimatedTime}</strong>
                      {pincodeResult.zoneName ? ` · ${pincodeResult.zoneName}` : ''}
                    </p>
                    <p className='text-xs text-green-600'>
                      {pincodeResult.deliveryCharge === 0 ? '🎉 Free Delivery' : `Delivery: ₹${pincodeResult.deliveryCharge}`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FaTimesCircle className='text-blue-500 mt-0.5 flex-shrink-0' size={15} />
                  <div>
                    <p className='text-sm font-semibold text-blue-700'>Standard Delivery</p>
                    <p className='text-xs text-blue-600 mt-0.5'>Estimated: <strong>{outsideDeliveryTime}</strong></p>
                    <p className='text-xs text-blue-500'>Charges may apply</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Trust Badges ── */}
        <div className='grid grid-cols-2 gap-2 mb-4'>
          {TRUST_BADGES.map(({ icon: Icon, label, sub, bg, icon_color }) => (
            <div key={label} className={`${bg} rounded-xl px-3 py-2.5 flex items-center gap-2`}>
              <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0'>
                <Icon className={icon_color} size={15} />
              </div>
              <div>
                <p className='text-xs font-bold text-gray-800 leading-tight'>{label}</p>
                <p className='text-[10px] text-gray-500'>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile description */}
        <div className='grid gap-3 lg:hidden mb-4'>
          {data.description && (
            <div>
              <p className='font-semibold text-gray-700 mb-1'>Description</p>
              <p className='text-sm text-gray-600 leading-relaxed'>{data.description}</p>
            </div>
          )}
          {data.unit && (
            <div><p className='font-semibold text-gray-700'>Unit</p><p className='text-sm text-gray-600'>{data.unit}</p></div>
          )}
          {data?.more_details && Object.keys(data.more_details).map((el, i) => (
            <div key={i}><p className='font-semibold text-gray-700'>{el}</p><p className='text-sm text-gray-600'>{data.more_details[el]}</p></div>
          ))}
        </div>

      </div>

      {/* ── Full-screen Lightbox with pinch-to-zoom ── */}
      {lightboxOpen && (
        <div className='fixed inset-0 z-[999] bg-black flex flex-col'>
          {/* Top bar */}
          <div className='flex items-center justify-between px-4 py-3 flex-shrink-0'>
            <p className='text-white/70 text-sm font-medium'>{image + 1} / {data.image.length}</p>
            <div className='flex items-center gap-3'>
              {zoom > 1 && (
                <button
                  onClick={() => { setZoom(1); setPanX(0); setPanY(0) }}
                  className='text-white/60 text-xs border border-white/30 rounded-full px-3 py-1'
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => { setLightboxOpen(false); setZoom(1); setPanX(0); setPanY(0) }}
                className='w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'
              >
                <FaXmark className='text-white' size={18} />
              </button>
            </div>
          </div>

          {/* Main image — pinch/pan area */}
          <div
            className='flex-1 overflow-hidden flex items-center justify-center relative'
            onTouchStart={e => {
              if (e.touches.length === 2) {
                isPinching.current = true
                lastTouches.current = e.touches
              } else if (e.touches.length === 1) {
                isPinching.current = false
                if (zoom > 1) {
                  panStart.current = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY }
                }
                const now = Date.now()
                if (now - lastTap.current < 300) {
                  setZoom(z => { if (z > 1) { setPanX(0); setPanY(0); return 1 } return 2.5 })
                }
                lastTap.current = now
              }
            }}
            onTouchMove={e => {
              e.preventDefault()
              if (e.touches.length === 2 && isPinching.current && lastTouches.current) {
                const prev = lastTouches.current
                const prevDist = Math.hypot(prev[0].clientX - prev[1].clientX, prev[0].clientY - prev[1].clientY)
                const currDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
                const ratio = currDist / prevDist
                setZoom(z => Math.min(5, Math.max(1, z * ratio)))
                lastTouches.current = e.touches
              } else if (e.touches.length === 1 && zoom > 1 && panStart.current) {
                setPanX(e.touches[0].clientX - panStart.current.x)
                setPanY(e.touches[0].clientY - panStart.current.y)
              }
            }}
            onTouchEnd={() => { lastTouches.current = null; panStart.current = null }}
            style={{ touchAction: 'none' }}
          >
            {data.image.length > 1 && zoom === 1 && (
              <button
                onClick={() => { setImage(prev => (prev - 1 + data.image.length) % data.image.length); setZoom(1); setPanX(0); setPanY(0) }}
                className='absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10'
              >
                <FaAngleLeft className='text-white' size={20} />
              </button>
            )}

            <img
              key={'lb-' + image}
              src={data.image[image]}
              alt={data.name}
              className='select-none pointer-events-none'
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 140px)',
                objectFit: 'contain',
                transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                transformOrigin: 'center center',
                transition: isPinching.current ? 'none' : 'transform 0.15s ease',
                animation: zoom === 1 ? 'fadeSlideIn 0.25s ease' : 'none',
              }}
            />

            {data.image.length > 1 && zoom === 1 && (
              <button
                onClick={() => { setImage(prev => (prev + 1) % data.image.length); setZoom(1); setPanX(0); setPanY(0) }}
                className='absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10'
              >
                <FaAngleRight className='text-white' size={20} />
              </button>
            )}
            {zoom === 1 && (
              <p className='absolute bottom-3 left-0 right-0 text-center text-white/40 text-xs'>Pinch or double-tap to zoom</p>
            )}
          </div>

          {/* Bottom thumbnails */}
          {data.image.length > 1 && (
            <div className='flex-shrink-0 flex justify-center gap-2 p-4 overflow-x-auto scrollbar-none'>
              {data.image.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setImage(i); setZoom(1); setPanX(0); setPanY(0) }}
                  className={`w-14 h-14 min-w-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    i === image ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt='' className='w-full h-full object-cover' />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* You May Also Like */}
      {data?._id && <YouMayAlsoLike productId={data._id} />}

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Q&A Section */}
      {data?._id && (
        <div className='mt-6 px-2'>
          <ProductQA productId={data._id} />
        </div>
      )}

    </section>
    </>
  )
}

export default ProductDisplayPage
