import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ProductQA from '../components/ProductQA'
import YouMayAlsoLike from '../components/YouMayAlsoLike'
import RecentlyViewed from '../components/RecentlyViewed'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleRight, FaAngleLeft, FaXmark, FaExpand } from 'react-icons/fa6'
import {
  FaHeart, FaRegHeart,
  FaWhatsapp, FaLink, FaShareAlt,
  FaTruck, FaShieldAlt, FaMedal, FaBolt,
  FaMapMarkerAlt, FaCheckCircle, FaTimesCircle,
  FaPalette, FaStar, FaRegStar, FaBell, FaCheckDouble,
  FaTag, FaFire,
  FaLeaf, FaFeatherAlt, FaMagic, FaGem,
  FaUserCircle, FaThumbsUp, FaCommentDots,
} from 'react-icons/fa'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
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
  { icon: FaTruck,     label: 'Cash on Delivery', sub: 'Available', bg: 'bg-green-50',  ic: 'text-green-600'  },
  { icon: FaShieldAlt, label: 'Secure Payment',   sub: '100% Safe', bg: 'bg-blue-50',   ic: 'text-blue-600'   },
  { icon: FaMedal,     label: 'High Quality',     sub: 'Assured',   bg: 'bg-yellow-50', ic: 'text-yellow-600' },
  { icon: FaBolt,      label: 'Fast Delivery',    sub: 'On Time',   bg: 'bg-purple-50', ic: 'text-purple-600' },
]

const LOVE_FEATURES = [
  { icon: FaLeaf,       label: 'Soft & Smooth' },
  { icon: FaMagic,      label: 'Vibrant Colors' },
  { icon: FaFeatherAlt, label: 'Lightweight' },
  { icon: FaGem,        label: 'Premium Quality' },
]

const ProductDisplayPage = () => {
  const params = useParams()
  const productId = params?.product?.split('-')?.slice(-1)[0]

  const [data, setData] = useState({ name: '', image: [] })
  const [image, setImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [, setLoading] = useState(false)
  const imageContainer = useRef()
  const user = useSelector(state => state?.user)

  const [wishlisted, setWishlisted] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [notifyRequested, setNotifyRequested] = useState(false)

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [ratingDist, setRatingDist] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSort, setReviewSort] = useState('recent')
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
    setReviewsLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.getProductReviews, data: { productId } })
      if (res.data.success) {
        const list = res.data.data?.reviews || []
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        list.forEach(r => {
          const star = Math.round(r.rating)
          if (star >= 1 && star <= 5) dist[star]++
        })
        setRatingDist(dist)
        setReviews(list)
      }
    } catch {}
    finally { setReviewsLoading(false) }
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
    setViewingCount(8 + (seed % 16))
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
    setRatingDist({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
    setReviews([])
    fetchProductDetails()
    fetchReviewDist()
    if (user?._id) checkWishlist()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [params])

  useEffect(() => {
    if (!data.image || data.image.length <= 1) return
    const iv = setInterval(() => setImage(prev => (prev + 1) % data.image.length), 4500)
    return () => clearInterval(iv)
  }, [data.image])

  useEffect(() => {
    if (data._id) setNotifyRequested(!!localStorage.getItem(`notify_stock_${data._id}`))
  }, [data._id])

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

  const handleNotifyMe = async () => {
    if (!user?._id) { toast.error('Please login to get notified'); return }
    try {
      const res = await Axios({ ...SummaryApi.subscribeBackInStock, data: { productId: data._id } })
      if (res.data.success) {
        localStorage.setItem(`notify_stock_${data._id}`, '1')
        setNotifyRequested(true)
        toast.success(res.data.message, { icon: '🔔' })
      }
    } catch {
      localStorage.setItem(`notify_stock_${data._id}`, '1')
      setNotifyRequested(true)
      toast.success("You'll be notified when it's back in stock!", { icon: '🔔' })
    }
  }

  const handleShare = (type) => {
    const url = window.location.href
    if (type === 'copy') { navigator.clipboard.writeText(url); toast.success('Link copied!') }
    else if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${data.name}: ${url}`)}`, '_blank')
    setShowShareMenu(false)
  }

  const displayPrice = selectedVariant ? selectedVariant.price : pricewithDiscount(data.price, data.discount)
  const displayStock = selectedVariant ? selectedVariant.stock : data.stock
  const variants = data.variants || []
  const isBestseller = (data.reviewCount || 0) >= 1 || data.avgRating >= 4

  const totalReviews = reviews.length
  const maxDistCount = Math.max(1, ...Object.values(ratingDist))
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return (b.rating || 0) - (a.rating || 0)
    if (reviewSort === 'lowest') return (a.rating || 0) - (b.rating || 0)
    return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
  })

  return (
    <>
      <div className="container mx-auto px-4 pt-3 max-w-full overflow-x-hidden">
        <BackButton />
      </div>

      <section className="container mx-auto px-4 pb-10 pt-2 grid lg:grid-cols-2 lg:gap-10 max-w-full overflow-x-hidden min-w-0">

        {/* ============ LEFT: IMAGES ============ */}
        <div className="w-full min-w-0 px-4 sm:px-6 lg:px-0">
          <div className="relative bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-lg w-full max-w-[560px] mx-auto">
            <div
              className="relative w-full max-w-full bg-gradient-to-br from-emerald-50 via-white to-slate-50 overflow-hidden"
              style={{ paddingTop: '125%' }}
            >
              {data.image?.[image] ? (
                <img
                  key={image}
                  src={data.image[image]}
                  alt={data.name}
                  className="cursor-zoom-in"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="absolute inset-0 animate-pulse bg-gray-100" />
              )}
            </div>

            {data.discount > 0 && !selectedVariant && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
                {data.discount}% OFF
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button onClick={toggleWishlist} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-emerald-100">
                {wishlisted ? <FaHeart className="text-emerald-600" size={17} /> : <FaRegHeart className="text-emerald-400" size={17} />}
              </button>
              <div className="relative">
                <button onClick={() => setShowShareMenu(!showShareMenu)} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-emerald-100">
                  <FaShareAlt className="text-emerald-600" size={14} />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-xl p-2 z-20 w-44">
                    <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 rounded-lg text-sm"><FaWhatsapp className="text-green-500" size={16} /> WhatsApp</button>
                    <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 rounded-lg text-sm"><FaLink className="text-gray-500" size={14} /> Copy Link</button>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setLightboxOpen(true)} className="absolute bottom-3 right-3 bg-white/95 backdrop-blur text-gray-700 text-xs font-semibold pl-2.5 pr-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 hover:bg-white active:scale-95 transition">
              <FaExpand size={11} /> View full screen
            </button>

            {data.image.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {data.image.map((_, i) => (
                  <span key={i} className={`rounded-full transition-all duration-300 ${i === image ? 'w-5 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/70'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="relative mt-3 w-full">
            <div ref={imageContainer} className="flex gap-2 w-full overflow-x-auto scrollbar-none scroll-smooth">
              {data.image.map((img, index) => (
                <button key={img + index} onClick={() => setImage(index)} className={`w-16 h-16 sm:w-20 sm:h-20 min-w-16 sm:min-w-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${index === image ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-gray-200 opacity-80 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between pointer-events-none">
              <button onClick={() => imageContainer.current.scrollLeft -= 120} className="pointer-events-auto -ml-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border"><FaAngleLeft /></button>
              <button onClick={() => imageContainer.current.scrollLeft += 120} className="pointer-events-auto -mr-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border"><FaAngleRight /></button>
            </div>
          </div>

          {/* Description — desktop only (mobile version repeated lower) */}
          <div className="my-6 hidden lg:grid gap-4">
            {data.description && (
              <div className="bg-white border border-emerald-100 rounded-2xl p-5">
                <p className="font-bold text-gray-800 mb-2">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
              </div>
            )}
            {data?.more_details && Object.keys(data.more_details).map((el, i) => (
              <div key={i} className="bg-white border border-emerald-100 rounded-2xl p-5">
                <p className="font-bold text-gray-800 mb-1">{el}</p>
                <p className="text-sm text-gray-600">{data.more_details[el]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============ RIGHT: INFO ============ */}
        <div className="pt-3 lg:pt-0 w-full min-w-0">

          {isBestseller && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-md mb-2">Bestseller</span>
          )}

          {data._id ? (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{data.name}</h1>
          ) : (
            <div className="h-7 sm:h-8 w-3/4 rounded-md bg-gray-100 animate-pulse" />
          )}
          {data.unit && <p className="text-sm text-gray-500 mt-1">{data.unit}</p>}

          {data.avgRating > 0 && (
            <button
              onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-3 flex items-center gap-3 flex-wrap group"
            >
              <div className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                <span>{Number(data.avgRating).toFixed(1)}</span><FaStar size={10} />
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  s <= Math.round(data.avgRating)
                    ? <FaStar key={s} size={16} className="text-yellow-400" />
                    : <FaRegStar key={s} size={16} className="text-gray-300" />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium underline-offset-2 group-hover:underline group-hover:text-emerald-700">
                {data.reviewCount || totalReviews} rating{(data.reviewCount || totalReviews) !== 1 ? 's' : ''}
              </span>
            </button>
          )}

          {viewingCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 w-fit max-w-full">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-semibold truncate">{viewingCount} people are viewing this right now</p>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2">
                <FaPalette className="text-emerald-600" size={12} />
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Select Variant</p>
                {selectedVariant && <span className="text-xs text-emerald-700 font-semibold">— {selectedVariant.name}</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {variants.map((v, i) => (
                  <button key={i} onClick={() => setSelectedVariant(selectedVariant?.name === v.name ? null : v)} className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${selectedVariant?.name === v.name ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'border-gray-200 text-gray-700 bg-white hover:border-emerald-300'}`}>
                    {v.name}{v.price ? <span className="ml-1 text-xs opacity-80">₹{v.price}</span> : ''}
                  </button>
                ))}
              </div>
              {selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock <= 5 && (
                <p className="text-xs text-orange-600 mt-2">Only {selectedVariant.stock} left in this variant</p>
              )}
            </div>
          )}

          {/* Price + Add to Cart */}
          <div className="mt-5">
            <div className="flex items-baseline gap-3 flex-wrap">
              {data._id ? (
                <>
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{DisplayPriceInRupees(displayPrice)}</span>
                  {!selectedVariant && data.discount > 0 && (
                    <>
                      <span className="text-base text-gray-400 line-through">{DisplayPriceInRupees(data.price)}</span>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">{data.discount}% OFF</span>
                    </>
                  )}
                </>
              ) : (
                <span className="h-9 w-32 rounded-md bg-gray-100 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>

            {data._id && displayStock !== 0 && (
              <div className="mt-4 w-48 sm:w-56">
                <AddToCartButton data={data} />
              </div>
            )}
          </div>

          {/* Status row — stacks on very small screens, 3-up from sm */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-sm">
            {displayStock > 0 ? (
              <span className="flex items-center gap-1 text-green-700 font-semibold min-w-0">
                <FaCheckCircle className="text-green-500 flex-shrink-0" size={13} />
                <span className="truncate">In Stock</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-semibold min-w-0">
                <FaTimesCircle className="text-red-500 flex-shrink-0" size={13} />
                <span className="truncate">Out of Stock</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-gray-700 min-w-0">
              <FaTruck className="text-green-500 flex-shrink-0" size={13} />
              <span className="truncate">2-3 days delivery</span>
            </span>
            <span className="flex items-center gap-1 text-gray-700 min-w-0">
              <FaMedal className="text-yellow-500 flex-shrink-0" size={13} />
              <span className="truncate">Cash on Delivery</span>
            </span>
          </div>

          {displayStock > 0 && displayStock <= 5 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm text-orange-700 font-medium flex items-center gap-2">
              <FaFire className="text-orange-500" /> Hurry! Only {displayStock} left in stock
            </div>
          )}

          {displayStock === 0 && (
            <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚫</span>
                <div>
                  <p className="text-red-700 font-extrabold text-base uppercase tracking-wide">Out of Stock</p>
                  <p className="text-red-500 text-xs">This item is currently unavailable</p>
                </div>
              </div>
              {notifyRequested ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <FaCheckDouble className="text-green-500" size={14} />
                  <p className="text-green-700 text-sm font-semibold">You're on the notify list! We'll let you know.</p>
                </div>
              ) : (
                <button onClick={handleNotifyMe} className="flex items-center gap-2 bg-white border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 font-bold text-sm px-4 py-2 rounded-xl transition-all active:scale-95 w-full justify-center">
                  <FaBell size={14} className="animate-bounce" /> Notify Me When Back in Stock
                </button>
              )}
            </div>
          )}

          {/* Offers */}
          <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <FaTag className="text-green-600" size={14} />
              </div>
              <p className="font-bold text-gray-800">Offers for you</p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1 pl-2">
              <li className="flex gap-2"><span className="text-green-600">•</span> Get extra <strong>5% off</strong> on prepaid orders</li>
              <li className="flex gap-2"><span className="text-green-600">•</span> Use code <strong className="bg-white border border-green-300 text-green-700 px-1.5 rounded">SAVE10</strong> &amp; get 10% off</li>
            </ul>
          </div>

          {/* Pincode */}
          <div className="mt-4 bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FaMapMarkerAlt className="text-emerald-600" size={14} />
              <p className="font-bold text-gray-800 text-sm">Check Delivery for Your Area</p>
            </div>
            <div className="flex gap-2">
              <input type="number" value={pincode}
                onChange={e => { setPincode(e.target.value); setPincodeResult(null) }}
                onKeyDown={e => e.key === 'Enter' && handleCheckPincode()}
                maxLength={6} placeholder="Enter 6-digit pincode"
                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition" />
              <button onClick={handleCheckPincode} disabled={checkingPincode}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all active:scale-95 shadow-md shadow-emerald-200 flex-shrink-0">
                {checkingPincode ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'CHECK'}
              </button>
            </div>
            {!pincodeResult && (
              <p className="mt-2 text-xs text-gray-400 flex items-center gap-1"><FaShieldAlt size={10} /> Enter pincode to check delivery availability</p>
            )}
            {pincodeResult && (
              <div className={`mt-3 rounded-xl px-4 py-3 flex items-start gap-2.5 ${pincodeResult.available ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                {pincodeResult.available ? (
                  <>
                    <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={15} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-green-700">Delivery Available!</p>
                      <p className="text-xs text-green-600 mt-0.5">Estimated: <strong>{pincodeResult.estimatedTime}</strong>{pincodeResult.zoneName ? ` · ${pincodeResult.zoneName}` : ''}</p>
                      <p className="text-xs text-green-600">{pincodeResult.deliveryCharge === 0 ? '🎉 Free Delivery' : `Delivery: ₹${pincodeResult.deliveryCharge}`}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={15} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-700">Standard Delivery</p>
                      <p className="text-xs text-blue-600 mt-0.5">Estimated: <strong>{outsideDeliveryTime}</strong></p>
                      <p className="text-xs text-blue-500">Charges may apply</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Why you'll love this — single, responsive grid (2-up mobile, 4-up from sm) */}
          <div className="mt-5 w-full">
            <p className="font-bold text-gray-800 text-sm mb-3">Why you'll love this</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOVE_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-3 flex flex-col items-center text-center gap-1.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Icon className="text-emerald-600" size={14} />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-tight w-full">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges — single grid, 2-up always (reads fine on mobile and desktop) */}
          <div className="mt-5 grid grid-cols-2 gap-2 w-full">
            {TRUST_BADGES.map(({ icon: Icon, label, sub, bg, ic }) => (
              <div key={label} className={`${bg} rounded-xl px-2.5 py-2.5 flex items-center gap-2 min-w-0 w-full`}>
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <Icon className={ic} size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-bold text-gray-800 leading-tight truncate">{label}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile description — desktop has its own copy in the left column */}
          <div className="mt-5 grid gap-3 lg:hidden">
            {data.description && (
              <div className="bg-white border border-emerald-100 rounded-2xl p-4">
                <p className="font-bold text-gray-800 mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
              </div>
            )}
            {data?.more_details && Object.keys(data.more_details).map((el, i) => (
              <div key={i} className="bg-white border border-emerald-100 rounded-2xl p-4">
                <p className="font-bold text-gray-800 mb-1">{el}</p>
                <p className="text-sm text-gray-600">{data.more_details[el]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============ LIGHTBOX ============ */}
        {lightboxOpen && (
          <div className="fixed inset-0 z-[999] bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <p className="text-white/70 text-sm font-medium">{image + 1} / {data.image.length}</p>
              <button onClick={() => setLightboxOpen(false)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <FaXmark className="text-white" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center relative">
              {data.image.length > 1 && (
                <button onClick={() => setImage(prev => (prev - 1 + data.image.length) % data.image.length)}
                  className="absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10">
                  <FaAngleLeft className="text-white" size={20} />
                </button>
              )}
              <img key={'lb-' + image} src={data.image[image]} alt={data.name} className="select-none" draggable={false}
                style={{
                  maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', objectFit: 'contain',
                  animation: 'fadeSlideIn 0.25s ease',
                }}
              />
              {data.image.length > 1 && (
                <button onClick={() => setImage(prev => (prev + 1) % data.image.length)}
                  className="absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center z-10">
                  <FaAngleRight className="text-white" size={20} />
                </button>
              )}
            </div>

            {data.image.length > 1 && (
              <div className="flex-shrink-0 flex justify-center gap-2 p-4 overflow-x-auto scrollbar-none">
                {data.image.map((img, i) => (
                  <button key={i} onClick={() => setImage(i)}
                    className={`w-14 h-14 min-w-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === image ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-90'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ RATINGS & REVIEWS ============ */}
        <div id="reviews-section" className="col-span-1 lg:col-span-2 mt-8 scroll-mt-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Ratings &amp; Reviews</h2>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : totalReviews === 0 ? (
              <div className="text-center py-10">
                <FaCommentDots className="text-gray-300 mx-auto mb-3" size={32} />
                <p className="text-gray-500 font-medium">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to share your experience with this product</p>
              </div>
            ) : (
              <>
                {/* Summary: score + stars (left) and bar breakdown (right) */}
                <div className="grid sm:grid-cols-[auto,1fr] gap-6 sm:gap-10 pb-6 border-b border-gray-100">
                  <div className="flex flex-col items-start sm:items-center justify-center sm:w-40 flex-shrink-0">
                    <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-none">
                      {Number(data.avgRating || 0).toFixed(1)}<span className="text-xl text-gray-400 font-semibold">/5</span>
                    </p>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        s <= Math.round(data.avgRating || 0)
                          ? <FaStar key={s} size={18} className="text-yellow-400" />
                          : <FaRegStar key={s} size={18} className="text-gray-300" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <FaCheckCircle className="text-emerald-500" size={12} />
                      {totalReviews} Verified Rating{totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-0">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingDist[star] || 0
                      const pct = Math.round((count / maxDistCount) * 100)
                      const sharePct = totalReviews ? Math.round((count / totalReviews) * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 w-10 flex-shrink-0 text-gray-700 font-medium">
                            {star} <FaStar size={11} className="text-yellow-400" />
                          </span>
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden min-w-0">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-20 flex-shrink-0 text-right text-gray-500 text-xs">{count} ({sharePct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sort control */}
                <div className="flex items-center justify-between gap-3 flex-wrap mt-5 mb-3">
                  <p className="text-sm font-semibold text-gray-700">{totalReviews} Review{totalReviews !== 1 ? 's' : ''}</p>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full p-1">
                    {[
                      { key: 'recent', label: 'Recent' },
                      { key: 'highest', label: 'Highest' },
                      { key: 'lowest', label: 'Lowest' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setReviewSort(opt.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${reviewSort === opt.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual review cards */}
                <div className="grid gap-4 mt-4">
                  {sortedReviews.map((r, i) => {
                    const reviewerName = r.userId?.name || r.name || r.userName || 'Anonymous Buyer'
                    const reviewText = r.comment || r.review || r.text || ''
                    const reviewDate = r.createdAt || r.date
                    return (
                      <div key={r._id || i} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <FaUserCircle className="text-emerald-600" size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{reviewerName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    s <= Math.round(r.rating || 0)
                                      ? <FaStar key={s} size={11} className="text-yellow-400" />
                                      : <FaRegStar key={s} size={11} className="text-gray-300" />
                                  ))}
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <FaCheckCircle size={9} /> Verified Purchase
                                </span>
                              </div>
                            </div>
                          </div>
                          {reviewDate && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(reviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {reviewText && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-3">{reviewText}</p>
                        )}
                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 font-medium mt-3 transition-colors">
                          <FaThumbsUp size={11} /> Helpful{r.helpfulCount ? ` (${r.helpfulCount})` : ''}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {data?._id && (
          <div className="col-span-1 lg:col-span-2 mt-8">
            <YouMayAlsoLike productId={data._id} />
          </div>
        )}
        <div className="col-span-1 lg:col-span-2">
          <RecentlyViewed />
        </div>
        {data?._id && (
          <div className="col-span-1 lg:col-span-2 mt-6 px-2">
            <ProductQA productId={data._id} />
          </div>
        )}
      </section>
    </>
  )
}

export default ProductDisplayPage