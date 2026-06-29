Bhai samajh gaya. Premium luxury vibe ke liye main use karunga:

**Palette:** Onyx black + Champagne Gold (`#B8935F`) + Warm Cream (`#FAF7F2`) — classic luxury feel
**Typography:** `Fraunces` (display serif) + `Outfit` (refined sans)
**Treatments:** Generous whitespace, gold hairline dividers, small-caps labels, glass-morphism floating controls, elegant section headers

Saath hi original code mein kuch syntax errors the (jaise `style={ paddingTop }` instead of `style={{ paddingTop }}`, missing closing braces in onClick handlers) — woh bhi fix kar dunga. Functionality, refs, handlers, props bilkul same rahenge — sirf visual layer luxury banegi.

Chalo banata hoon:
Action: file_editor create /app/ProductDisplayPage.jsx --file-text "import React, { useEffect, useRef, useState } from 'react'
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

/* ─────────────────────────────────────────────
   LUXURY DESIGN TOKENS
   Onyx + Champagne Gold + Warm Cream
   ───────────────────────────────────────────── */
const LUX = {
  cream: '#FAF7F2',
  paper: '#FFFFFF',
  ivory: '#F3EEE3',
  onyx: '#0F0F0F',
  ink: '#1C1B19',
  graphite: '#3A3733',
  mute: '#6B6359',
  hairline: '#E8E2D5',
  gold: '#B8935F',
  goldDark: '#9A7A4D',
  goldLight: '#D9BE92',
  emerald: '#0F5132',
  rouge: '#8E2F1C',
}

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
  { icon: FaTruck,     label: 'Cash on Delivery', sub: 'Available nationwide' },
  { icon: FaShieldAlt, label: 'Secure Checkout',  sub: 'Encrypted & verified' },
  { icon: FaMedal,     label: 'Artisan Quality',  sub: 'Hand-finished pieces' },
  { icon: FaBolt,      label: 'Priority Dispatch',sub: 'Ships within 24 hrs' },
]

const LOVE_FEATURES = [
  { icon: FaLeaf,       label: 'Soft & Smooth' },
  { icon: FaMagic,      label: 'Vibrant Colours' },
  { icon: FaFeatherAlt, label: 'Featherlight' },
  { icon: FaGem,        label: 'Premium Crafted' },
]

/* Tiny reusable label — small-caps gold marker used across sections */
const Eyebrow = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <span className=\"h-px w-6\" style={{ background: LUX.gold }} />
    <span
      className=\"text-[10px] font-semibold tracking-[0.22em] uppercase\"
      style={{ color: LUX.gold, fontFamily: \"'Outfit', system-ui, sans-serif\" }}
    >
      {children}
    </span>
  </div>
)

const ProductDisplayPage = () => {
  const params = useParams()
  const productId = params?.product?.split('-')?.slice(-1)[0]

  const [data, setData] = useState({ name: '', image: [] })
  const [image, setImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [, setLoading] = useState(false)
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
      toast.success(\"You'll be notified when it's back in stock!\", { icon: '🔔' })
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
      {/* Embedded luxury type system + subtle motion */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');
        .pdp-root { font-family: 'Outfit', system-ui, -apple-system, sans-serif; color: ${LUX.ink}; background: ${LUX.cream}; }
        .pdp-serif { font-family: 'Fraunces', 'Cormorant Garamond', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.01em; }
        .pdp-grain { position: relative; }
        .pdp-grain::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35; mix-blend-mode: multiply;
          background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");
        }
        .pdp-hairline { background: ${LUX.hairline}; }
        .pdp-card { background: ${LUX.paper}; border: 1px solid ${LUX.hairline}; }
        .pdp-card-cream { background: ${LUX.ivory}; border: 1px solid ${LUX.hairline}; }
        .pdp-input { background: ${LUX.paper}; border: 1px solid ${LUX.hairline}; color: ${LUX.ink}; }
        .pdp-input:focus { outline: none; border-color: ${LUX.gold}; box-shadow: 0 0 0 3px rgba(184,147,95,0.15); }
        .pdp-chip { border: 1px solid ${LUX.hairline}; background: ${LUX.paper}; color: ${LUX.graphite}; transition: all .2s ease; }
        .pdp-chip:hover { border-color: ${LUX.gold}; color: ${LUX.onyx}; }
        .pdp-chip-active { border-color: ${LUX.onyx} !important; background: ${LUX.onyx} !important; color: ${LUX.cream} !important; }
        .pdp-btn-primary { background: ${LUX.onyx}; color: ${LUX.cream}; transition: all .25s ease; letter-spacing: .12em; }
        .pdp-btn-primary:hover { background: ${LUX.gold}; color: ${LUX.onyx}; }
        .pdp-btn-ghost { color: ${LUX.ink}; border: 1px solid ${LUX.hairline}; background: ${LUX.paper}; transition: all .2s ease; }
        .pdp-btn-ghost:hover { border-color: ${LUX.onyx}; }
        .pdp-floating { background: rgba(255,255,255,0.85); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(232,226,213,0.7); }
        .pdp-divider-gold { height: 1px; background: linear-gradient(90deg, transparent, ${LUX.goldLight}, transparent); }
        @keyframes pdpFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes pdpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pdp-fade-up { animation: pdpFadeUp .6s ease both; }
        .pdp-fade-in { animation: pdpFadeIn .4s ease both; }
        .pdp-thumb-active { box-shadow: 0 0 0 1px ${LUX.onyx}, 0 8px 24px -10px rgba(15,15,15,0.25); }
        /* hide scrollbar */
        .pdp-noscroll::-webkit-scrollbar { display: none; }
        .pdp-noscroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className=\"pdp-root\">
        <div className=\"container mx-auto px-4 pt-4 max-w-full overflow-x-hidden\">
          <BackButton />
        </div>

        <section className=\"container mx-auto px-4 pb-14 pt-2 grid lg:grid-cols-2 lg:gap-14 max-w-full overflow-x-hidden min-w-0\">

          {/* ============ LEFT: IMAGES ============ */}
          <div className=\"w-full min-w-0 px-1 sm:px-2 lg:px-0\">
            <div
              className=\"pdp-grain relative overflow-hidden w-full mx-auto\"
              style={{
                background: LUX.paper,
                border: `1px solid ${LUX.hairline}`,
                borderRadius: '4px',
                boxShadow: '0 30px 60px -30px rgba(15,15,15,0.18), 0 8px 24px -16px rgba(15,15,15,0.12)',
              }}
              data-testid=\"product-hero-frame\"
            >
              {/* gold corner accents */}
              <span className=\"absolute top-3 left-3 w-5 h-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute top-3 left-3 h-5 w-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute top-3 right-3 w-5 h-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute top-3 right-3 h-5 w-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute bottom-3 left-3 w-5 h-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute bottom-3 left-3 h-5 w-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute bottom-3 right-3 w-5 h-px\" style={{ background: LUX.gold }} />
              <span className=\"absolute bottom-3 right-3 h-5 w-px\" style={{ background: LUX.gold }} />

              <div
                className=\"relative w-full max-w-full overflow-hidden\"
                style={{
                  paddingTop: '125%',
                  background: `radial-gradient(ellipse at center, ${LUX.paper} 0%, ${LUX.ivory} 100%)`,
                }}
              >
                {data.image?.[image] ? (
                  <img
                    key={image}
                    src={data.image[image]}
                    alt={data.name}
                    className=\"cursor-zoom-in pdp-fade-in\"
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onClick={() => setLightboxOpen(true)}
                    data-testid=\"product-hero-image\"
                  />
                ) : (
                  <div className=\"absolute inset-0 animate-pulse\" style={{ background: LUX.ivory }} />
                )}
              </div>

              {/* Discount tag — onyx pill with gold underline */}
              {data.discount > 0 && !selectedVariant && (
                <div
                  className=\"absolute top-6 left-6 px-3 py-2 pdp-fade-up\"
                  style={{ background: LUX.onyx, color: LUX.cream, borderRadius: '2px' }}
                  data-testid=\"product-discount-tag\"
                >
                  <p className=\"text-[9px] tracking-[0.25em] font-semibold uppercase\" style={{ color: LUX.goldLight }}>Saving</p>
                  <p className=\"pdp-serif text-xl font-medium leading-none mt-0.5\">{data.discount}<span className=\"text-sm align-top\">%</span></p>
                </div>
              )}

              {/* Floating actions — glass */}
              <div className=\"absolute top-6 right-6 flex flex-col gap-2 z-10\">
                <button
                  onClick={toggleWishlist}
                  className=\"pdp-floating w-11 h-11 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform\"
                  data-testid=\"wishlist-toggle-btn\"
                  aria-label=\"Wishlist\"
                >
                  {wishlisted
                    ? <FaHeart size={16} style={{ color: LUX.rouge }} />
                    : <FaRegHeart size={16} style={{ color: LUX.graphite }} />}
                </button>
                <div className=\"relative\">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className=\"pdp-floating w-11 h-11 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform\"
                    data-testid=\"share-toggle-btn\"
                    aria-label=\"Share\"
                  >
                    <FaShareAlt size={13} style={{ color: LUX.graphite }} />
                  </button>
                  {showShareMenu && (
                    <div
                      className=\"absolute right-0 top-12 p-1.5 z-20 w-44 pdp-fade-up\"
                      style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px', boxShadow: '0 18px 36px -18px rgba(15,15,15,0.25)' }}
                    >
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className=\"w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#FAF7F2] rounded-sm transition\"
                        data-testid=\"share-whatsapp-btn\"
                      >
                        <FaWhatsapp size={15} style={{ color: '#25D366' }} />
                        <span style={{ color: LUX.ink }}>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className=\"w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#FAF7F2] rounded-sm transition\"
                        data-testid=\"share-copy-btn\"
                      >
                        <FaLink size={13} style={{ color: LUX.graphite }} />
                        <span style={{ color: LUX.ink }}>Copy link</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fullscreen */}
              <button
                onClick={() => setLightboxOpen(true)}
                className=\"pdp-floating absolute bottom-6 right-6 text-xs font-medium pl-2.5 pr-3 py-2 rounded-full flex items-center gap-1.5 hover:scale-105 active:scale-95 transition\"
                style={{ color: LUX.ink, letterSpacing: '0.04em' }}
                data-testid=\"open-lightbox-btn\"
              >
                <FaExpand size={11} /> View full
              </button>

              {/* Dots */}
              {data.image.length > 1 && (
                <div className=\"absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none\">
                  {data.image.map((_, i) => (
                    <span
                      key={i}
                      className=\"rounded-full transition-all duration-300\"
                      style={{
                        width: i === image ? '18px' : '6px',
                        height: '6px',
                        background: i === image ? LUX.onyx : 'rgba(15,15,15,0.25)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className=\"relative mt-4 w-full\">
              <div ref={imageContainer} className=\"flex gap-2.5 w-full overflow-x-auto pdp-noscroll scroll-smooth py-1\">
                {data.image.map((img, index) => (
                  <button
                    key={img + index}
                    onClick={() => setImage(index)}
                    className={`w-[68px] h-[68px] sm:w-20 sm:h-20 min-w-[68px] sm:min-w-20 overflow-hidden flex-shrink-0 transition-all ${index === image ? 'pdp-thumb-active' : 'opacity-70 hover:opacity-100'}`}
                    style={{
                      background: LUX.paper,
                      border: `1px solid ${index === image ? LUX.onyx : LUX.hairline}`,
                      borderRadius: '3px',
                    }}
                    data-testid={`thumb-${index}`}
                  >
                    <img src={img} alt=\"\" className=\"w-full h-full object-cover\" />
                  </button>
                ))}
              </div>
              <div className=\"hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between pointer-events-none\">
                <button
                  onClick={() => { if (imageContainer.current) imageContainer.current.scrollLeft -= 120 }}
                  className=\"pointer-events-auto -ml-4 z-10 w-9 h-9 rounded-full flex items-center justify-center pdp-floating shadow\"
                  aria-label=\"scroll thumbnails left\"
                >
                  <FaAngleLeft style={{ color: LUX.ink }} />
                </button>
                <button
                  onClick={() => { if (imageContainer.current) imageContainer.current.scrollLeft += 120 }}
                  className=\"pointer-events-auto -mr-4 z-10 w-9 h-9 rounded-full flex items-center justify-center pdp-floating shadow\"
                  aria-label=\"scroll thumbnails right\"
                >
                  <FaAngleRight style={{ color: LUX.ink }} />
                </button>
              </div>
            </div>

            {/* Description — desktop */}
            <div className=\"my-8 hidden lg:grid gap-4\">
              {data.description && (
                <div className=\"pdp-card p-7\" style={{ borderRadius: '4px' }}>
                  <Eyebrow className=\"mb-3\">The Story</Eyebrow>
                  <h3 className=\"pdp-serif text-2xl mb-3\" style={{ color: LUX.onyx }}>Description</h3>
                  <p className=\"text-[15px] leading-[1.85]\" style={{ color: LUX.mute }}>{data.description}</p>
                </div>
              )}
              {data?.more_details && Object.keys(data.more_details).map((el, i) => (
                <div key={i} className=\"pdp-card p-7\" style={{ borderRadius: '4px' }}>
                  <Eyebrow className=\"mb-2\">Detail</Eyebrow>
                  <p className=\"pdp-serif text-xl mb-1.5\" style={{ color: LUX.onyx }}>{el}</p>
                  <p className=\"text-[15px] leading-[1.8]\" style={{ color: LUX.mute }}>{data.more_details[el]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ============ RIGHT: INFO ============ */}
          <div className=\"pt-4 lg:pt-2 w-full min-w-0\">

            {/* Bestseller eyebrow */}
            <div className=\"flex items-center gap-3 flex-wrap\">
              <Eyebrow>Curated Edit</Eyebrow>
              {isBestseller && (
                <span
                  className=\"inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase px-2.5 py-1\"
                  style={{ background: LUX.onyx, color: LUX.goldLight, borderRadius: '2px' }}
                  data-testid=\"bestseller-tag\"
                >
                  ★ Bestseller
                </span>
              )}
            </div>

            <h1
              className=\"pdp-serif mt-3 leading-[1.05] font-medium\"
              style={{ color: LUX.onyx, fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)' }}
              data-testid=\"product-name\"
            >
              {data.name}
            </h1>

            {data.unit && (
              <p className=\"text-[13px] mt-2 tracking-wide\" style={{ color: LUX.mute }}>
                <span style={{ color: LUX.gold }}>—</span> {data.unit}
              </p>
            )}

            {/* Rating */}
            {data.avgRating > 0 && (
              <button
                onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className=\"mt-4 flex items-center gap-3 flex-wrap group\"
                data-testid=\"rating-summary-btn\"
              >
                <div
                  className=\"flex items-center gap-1 text-xs font-semibold px-2.5 py-1\"
                  style={{ background: LUX.onyx, color: LUX.goldLight, borderRadius: '2px' }}
                >
                  <span>{Number(data.avgRating).toFixed(1)}</span><FaStar size={10} />
                </div>
                <div className=\"flex gap-0.5\">
                  {[1, 2, 3, 4, 5].map(s => (
                    s <= Math.round(data.avgRating)
                      ? <FaStar key={s} size={15} style={{ color: LUX.gold }} />
                      : <FaRegStar key={s} size={15} style={{ color: LUX.hairline }} />
                  ))}
                </div>
                <span className=\"text-[13px] font-medium underline-offset-4 group-hover:underline\" style={{ color: LUX.mute }}>
                  {data.reviewCount || totalReviews} rating{(data.reviewCount || totalReviews) !== 1 ? 's' : ''}
                </span>
              </button>
            )}

            {/* Live viewing */}
            {viewingCount > 0 && (
              <div
                className=\"flex items-center gap-2 mt-4 px-3 py-1.5 w-fit max-w-full\"
                style={{ background: LUX.ivory, border: `1px solid ${LUX.hairline}`, borderRadius: '999px' }}
              >
                <span className=\"inline-block w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0\" style={{ background: LUX.gold }} />
                <p className=\"text-[11px] font-medium tracking-wide\" style={{ color: LUX.graphite }}>
                  {viewingCount} guests viewing right now
                </p>
              </div>
            )}

            <div className=\"pdp-divider-gold my-6\" />

            {/* Variants */}
            {variants.length > 0 && (
              <div className=\"mb-6\">
                <Eyebrow className=\"mb-3\">
                  <span className=\"flex items-center gap-1.5\"><FaPalette size={9} /> Choose Variant</span>
                </Eyebrow>
                <div className=\"flex gap-2 flex-wrap\">
                  {variants.map((v, i) => {
                    const active = selectedVariant?.name === v.name
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(active ? null : v)}
                        className={`pdp-chip ${active ? 'pdp-chip-active' : ''} px-4 py-2 text-[13px] font-medium`}
                        style={{ borderRadius: '999px' }}
                        data-testid={`variant-${i}`}
                      >
                        {v.name}
                        {v.price ? <span className=\"ml-1.5 text-[11px] opacity-70\">₹{v.price}</span> : ''}
                      </button>
                    )
                  })}
                </div>
                {selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock <= 5 && (
                  <p className=\"text-[12px] mt-3 font-medium\" style={{ color: LUX.rouge }}>
                    Only {selectedVariant.stock} left in this variant
                  </p>
                )}
              </div>
            )}

            {/* Price + CTA */}
            <div className=\"mt-2\">
              <p className=\"text-[10px] tracking-[0.22em] uppercase font-semibold mb-1.5\" style={{ color: LUX.mute }}>Price</p>
              <div className=\"flex items-baseline gap-3 flex-wrap\">
                <span
                  className=\"pdp-serif font-medium\"
                  style={{ color: LUX.onyx, fontSize: 'clamp(2rem, 5.5vw, 3rem)', lineHeight: 1 }}
                  data-testid=\"product-price\"
                >
                  {DisplayPriceInRupees(displayPrice)}
                </span>
                {!selectedVariant && data.discount > 0 && (
                  <>
                    <span className=\"text-base line-through\" style={{ color: LUX.mute }}>
                      {DisplayPriceInRupees(data.price)}
                    </span>
                    <span
                      className=\"text-[11px] font-semibold px-2 py-1 tracking-wider uppercase\"
                      style={{ background: LUX.ivory, color: LUX.emerald, border: `1px solid ${LUX.hairline}`, borderRadius: '2px' }}
                    >
                      Save {data.discount}%
                    </span>
                  </>
                )}
              </div>
              <p className=\"text-[11px] mt-2 tracking-wide\" style={{ color: LUX.mute }}>Inclusive of all taxes · Complimentary gift wrap</p>

              {displayStock !== 0 && (
                <div className=\"mt-5\" data-testid=\"add-to-cart-wrapper\">
                  <AddToCartButton data={data} />
                </div>
              )}
            </div>

            {/* Status row */}
            <div className=\"mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] sm:text-[13px]\">
              {displayStock > 0 ? (
                <span className=\"flex items-center gap-2 font-medium min-w-0\" style={{ color: LUX.emerald }} data-testid=\"stock-status\">
                  <FaCheckCircle className=\"flex-shrink-0\" size={13} />
                  <span className=\"truncate\">In Stock</span>
                </span>
              ) : (
                <span className=\"flex items-center gap-2 font-medium min-w-0\" style={{ color: LUX.rouge }} data-testid=\"stock-status\">
                  <FaTimesCircle className=\"flex-shrink-0\" size={13} />
                  <span className=\"truncate\">Out of Stock</span>
                </span>
              )}
              <span className=\"flex items-center gap-2 min-w-0\" style={{ color: LUX.graphite }}>
                <FaTruck className=\"flex-shrink-0\" size={13} style={{ color: LUX.gold }} />
                <span className=\"truncate\">2–3 days delivery</span>
              </span>
              <span className=\"flex items-center gap-2 min-w-0\" style={{ color: LUX.graphite }}>
                <FaMedal className=\"flex-shrink-0\" size={13} style={{ color: LUX.gold }} />
                <span className=\"truncate\">Cash on Delivery</span>
              </span>
            </div>

            {/* Low-stock urgency */}
            {displayStock > 0 && displayStock <= 5 && (
              <div
                className=\"mt-5 px-4 py-3 text-[13px] font-medium flex items-center gap-2.5\"
                style={{ background: LUX.ivory, border: `1px solid ${LUX.goldLight}`, color: LUX.graphite, borderRadius: '3px' }}
              >
                <FaFire style={{ color: LUX.rouge }} />
                Only <strong style={{ color: LUX.onyx }}>{displayStock}</strong> piece{displayStock !== 1 ? 's' : ''} remaining in this collection
              </div>
            )}

            {/* Out of stock block */}
            {displayStock === 0 && (
              <div
                className=\"mt-5 px-5 py-5\"
                style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}
                data-testid=\"out-of-stock-block\"
              >
                <div className=\"flex items-start gap-3 mb-4\">
                  <span
                    className=\"inline-flex items-center justify-center w-10 h-10 flex-shrink-0\"
                    style={{ background: LUX.onyx, color: LUX.goldLight, borderRadius: '50%' }}
                  >
                    <FaTimesCircle size={18} />
                  </span>
                  <div>
                    <p className=\"pdp-serif text-lg font-medium\" style={{ color: LUX.onyx }}>Currently Reserved</p>
                    <p className=\"text-[12px] mt-0.5\" style={{ color: LUX.mute }}>This piece is awaiting fresh restock</p>
                  </div>
                </div>
                {notifyRequested ? (
                  <div
                    className=\"flex items-center gap-2.5 px-3 py-2.5\"
                    style={{ background: LUX.ivory, border: `1px solid ${LUX.hairline}`, borderRadius: '3px' }}
                  >
                    <FaCheckDouble size={14} style={{ color: LUX.emerald }} />
                    <p className=\"text-[13px] font-medium\" style={{ color: LUX.graphite }}>
                      You're on the priority list. We'll be in touch.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleNotifyMe}
                    className=\"pdp-btn-primary flex items-center justify-center gap-2 w-full text-[12px] font-semibold uppercase px-5 py-3.5 active:scale-[0.99] transition-all\"
                    style={{ borderRadius: '2px' }}
                    data-testid=\"notify-me-btn\"
                  >
                    <FaBell size={13} /> Notify Me When Available
                  </button>
                )}
              </div>
            )}

            {/* Offers */}
            <div
              className=\"mt-6 p-5\"
              style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}
            >
              <div className=\"flex items-center gap-2.5 mb-3\">
                <div
                  className=\"w-9 h-9 flex items-center justify-center flex-shrink-0\"
                  style={{ background: LUX.ivory, borderRadius: '2px' }}
                >
                  <FaTag size={13} style={{ color: LUX.gold }} />
                </div>
                <div>
                  <Eyebrow>Privileges</Eyebrow>
                  <p className=\"pdp-serif text-lg mt-0.5\" style={{ color: LUX.onyx }}>Offers for you</p>
                </div>
              </div>
              <ul className=\"text-[13.5px] space-y-2 mt-3\" style={{ color: LUX.graphite }}>
                <li className=\"flex gap-2.5\">
                  <span className=\"mt-2 flex-shrink-0 w-1 h-1 rounded-full\" style={{ background: LUX.gold }} />
                  <span>Additional <strong style={{ color: LUX.onyx }}>5% off</strong> on prepaid orders</span>
                </li>
                <li className=\"flex gap-2.5\">
                  <span className=\"mt-2 flex-shrink-0 w-1 h-1 rounded-full\" style={{ background: LUX.gold }} />
                  <span>
                    Apply code{' '}
                    <strong
                      className=\"px-1.5 py-0.5 tracking-wider\"
                      style={{ background: LUX.ivory, border: `1px solid ${LUX.goldLight}`, color: LUX.onyx, borderRadius: '2px' }}
                    >
                      SAVE10
                    </strong>{' '}
                    for an extra 10% off
                  </span>
                </li>
              </ul>
            </div>

            {/* Pincode */}
            <div
              className=\"mt-5 p-5\"
              style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}
            >
              <div className=\"flex items-center gap-2 mb-1\">
                <FaMapMarkerAlt size={13} style={{ color: LUX.gold }} />
                <Eyebrow>Delivery</Eyebrow>
              </div>
              <p className=\"pdp-serif text-lg mb-4\" style={{ color: LUX.onyx }}>Check service availability</p>
              <div className=\"flex gap-2\">
                <input
                  type=\"number\"
                  value={pincode}
                  onChange={e => { setPincode(e.target.value); setPincodeResult(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckPincode()}
                  maxLength={6}
                  placeholder=\"6-digit pincode\"
                  className=\"pdp-input flex-1 min-w-0 px-4 py-3 text-[13.5px] tracking-wide\"
                  style={{ borderRadius: '2px' }}
                  data-testid=\"pincode-input\"
                />
                <button
                  onClick={handleCheckPincode}
                  disabled={checkingPincode}
                  className=\"pdp-btn-primary px-6 py-3 text-[11px] font-semibold uppercase disabled:opacity-60 active:scale-[0.98] flex-shrink-0\"
                  style={{ borderRadius: '2px' }}
                  data-testid=\"pincode-check-btn\"
                >
                  {checkingPincode
                    ? <div className=\"w-4 h-4 border-2 border-t-transparent rounded-full animate-spin\" style={{ borderColor: LUX.cream }} />
                    : 'Check'}
                </button>
              </div>
              {!pincodeResult && (
                <p className=\"mt-2.5 text-[11.5px] flex items-center gap-1.5\" style={{ color: LUX.mute }}>
                  <FaShieldAlt size={10} style={{ color: LUX.gold }} /> Enter your pincode to view delivery details
                </p>
              )}
              {pincodeResult && (
                <div
                  className=\"mt-4 px-4 py-3 flex items-start gap-3 pdp-fade-up\"
                  style={{
                    background: LUX.ivory,
                    border: `1px solid ${pincodeResult.available ? LUX.goldLight : LUX.hairline}`,
                    borderRadius: '3px',
                  }}
                >
                  {pincodeResult.available ? (
                    <>
                      <FaCheckCircle className=\"mt-0.5 flex-shrink-0\" size={15} style={{ color: LUX.emerald }} />
                      <div className=\"min-w-0\">
                        <p className=\"text-[13.5px] font-semibold\" style={{ color: LUX.onyx }}>Delivery Available</p>
                        <p className=\"text-[12px] mt-0.5\" style={{ color: LUX.graphite }}>
                          Estimated: <strong style={{ color: LUX.onyx }}>{pincodeResult.estimatedTime}</strong>
                          {pincodeResult.zoneName ? ` · ${pincodeResult.zoneName}` : ''}
                        </p>
                        <p className=\"text-[12px]\" style={{ color: pincodeResult.deliveryCharge === 0 ? LUX.emerald : LUX.graphite }}>
                          {pincodeResult.deliveryCharge === 0 ? 'Complimentary delivery' : `Delivery: ₹${pincodeResult.deliveryCharge}`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt className=\"mt-0.5 flex-shrink-0\" size={15} style={{ color: LUX.gold }} />
                      <div className=\"min-w-0\">
                        <p className=\"text-[13.5px] font-semibold\" style={{ color: LUX.onyx }}>Standard Delivery</p>
                        <p className=\"text-[12px] mt-0.5\" style={{ color: LUX.graphite }}>
                          Estimated: <strong style={{ color: LUX.onyx }}>{outsideDeliveryTime}</strong>
                        </p>
                        <p className=\"text-[12px]\" style={{ color: LUX.mute }}>Charges may apply</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Why you'll love this */}
            <div className=\"mt-7 w-full\">
              <Eyebrow className=\"mb-3\">Why You'll Love It</Eyebrow>
              <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-2.5\">
                {LOVE_FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className=\"px-3 py-4 flex flex-col items-center text-center gap-2 min-w-0 pdp-fade-up\"
                    style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '3px' }}
                  >
                    <div
                      className=\"w-10 h-10 flex items-center justify-center flex-shrink-0\"
                      style={{ background: LUX.ivory, borderRadius: '50%', border: `1px solid ${LUX.goldLight}` }}
                    >
                      <Icon size={14} style={{ color: LUX.gold }} />
                    </div>
                    <p className=\"text-[11.5px] font-medium leading-tight w-full\" style={{ color: LUX.graphite, letterSpacing: '0.02em' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className=\"mt-5 grid grid-cols-2 gap-2.5 w-full\">
              {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className=\"px-3 py-3 flex items-center gap-3 min-w-0 w-full\"
                  style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '3px' }}
                >
                  <div
                    className=\"w-10 h-10 flex items-center justify-center flex-shrink-0\"
                    style={{ background: LUX.onyx, borderRadius: '2px' }}
                  >
                    <Icon size={14} style={{ color: LUX.goldLight }} />
                  </div>
                  <div className=\"min-w-0 flex-1\">
                    <p className=\"text-[12px] font-semibold leading-tight truncate\" style={{ color: LUX.onyx }}>{label}</p>
                    <p className=\"text-[10.5px] truncate mt-0.5\" style={{ color: LUX.mute }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile description */}
            <div className=\"mt-7 grid gap-3 lg:hidden\">
              {data.description && (
                <div className=\"p-5\" style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}>
                  <Eyebrow className=\"mb-2\">The Story</Eyebrow>
                  <p className=\"pdp-serif text-xl mb-2\" style={{ color: LUX.onyx }}>Description</p>
                  <p className=\"text-[14px] leading-[1.8]\" style={{ color: LUX.mute }}>{data.description}</p>
                </div>
              )}
              {data?.more_details && Object.keys(data.more_details).map((el, i) => (
                <div key={i} className=\"p-5\" style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}>
                  <Eyebrow className=\"mb-2\">Detail</Eyebrow>
                  <p className=\"pdp-serif text-lg mb-1\" style={{ color: LUX.onyx }}>{el}</p>
                  <p className=\"text-[14px] leading-[1.75]\" style={{ color: LUX.mute }}>{data.more_details[el]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ============ LIGHTBOX ============ */}
          {lightboxOpen && (
            <div className=\"fixed inset-0 z-[999] flex flex-col\" style={{ background: LUX.onyx }} data-testid=\"lightbox\">
              <div className=\"flex items-center justify-between px-5 py-4 flex-shrink-0\">
                <p className=\"text-[12px] tracking-[0.2em] uppercase font-medium\" style={{ color: LUX.goldLight }}>
                  {String(image + 1).padStart(2, '0')} <span style={{ color: LUX.mute }}>/ {String(data.image.length).padStart(2, '0')}</span>
                </p>
                <div className=\"flex items-center gap-3\">
                  {zoom > 1 && (
                    <button
                      onClick={() => { setZoom(1); setPanX(0); setPanY(0) }}
                      className=\"text-[11px] tracking-[0.18em] uppercase px-3 py-1.5\"
                      style={{ color: LUX.goldLight, border: `1px solid ${LUX.goldDark}`, borderRadius: '999px' }}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => { setLightboxOpen(false); setZoom(1); setPanX(0); setPanY(0) }}
                    className=\"w-10 h-10 rounded-full flex items-center justify-center transition-colors\"
                    style={{ background: 'rgba(255,255,255,0.08)', color: LUX.cream }}
                    data-testid=\"lightbox-close-btn\"
                  >
                    <FaXmark size={18} />
                  </button>
                </div>
              </div>

              <div
                className=\"flex-1 overflow-hidden flex items-center justify-center relative\"
                onTouchStart={e => {
                  if (e.touches.length === 2) { isPinching.current = true; lastTouches.current = e.touches }
                  else if (e.touches.length === 1) {
                    isPinching.current = false
                    if (zoom > 1) panStart.current = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY }
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
                    setZoom(z => Math.min(5, Math.max(1, z * (currDist / prevDist))))
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
                    className=\"absolute left-3 w-11 h-11 rounded-full flex items-center justify-center z-10 transition\"
                    style={{ background: 'rgba(255,255,255,0.08)', color: LUX.cream }}
                  >
                    <FaAngleLeft size={20} />
                  </button>
                )}
                <img
                  key={'lb-' + image}
                  src={data.image[image]}
                  alt={data.name}
                  className=\"select-none pointer-events-none\"
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 160px)',
                    objectFit: 'contain',
                    transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                    transformOrigin: 'center center',
                    transition: isPinching.current ? 'none' : 'transform 0.18s ease',
                  }}
                />
                {data.image.length > 1 && zoom === 1 && (
                  <button
                    onClick={() => { setImage(prev => (prev + 1) % data.image.length); setZoom(1); setPanX(0); setPanY(0) }}
                    className=\"absolute right-3 w-11 h-11 rounded-full flex items-center justify-center z-10 transition\"
                    style={{ background: 'rgba(255,255,255,0.08)', color: LUX.cream }}
                  >
                    <FaAngleRight size={20} />
                  </button>
                )}
                {zoom === 1 && (
                  <p className=\"absolute bottom-4 left-0 right-0 text-center text-[11px] tracking-[0.2em] uppercase\" style={{ color: LUX.mute }}>
                    Pinch or double-tap to zoom
                  </p>
                )}
              </div>

              {data.image.length > 1 && (
                <div className=\"flex-shrink-0 flex justify-center gap-2 p-4 overflow-x-auto pdp-noscroll\">
                  {data.image.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setImage(i); setZoom(1); setPanX(0); setPanY(0) }}
                      className=\"w-14 h-14 min-w-14 overflow-hidden transition-all flex-shrink-0\"
                      style={{
                        border: `1px solid ${i === image ? LUX.gold : 'rgba(255,255,255,0.2)'}`,
                        opacity: i === image ? 1 : 0.55,
                        borderRadius: '3px',
                        transform: i === image ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <img src={img} alt=\"\" className=\"w-full h-full object-cover\" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ RATINGS & REVIEWS ============ */}
          <div id=\"reviews-section\" className=\"col-span-1 lg:col-span-2 mt-12 scroll-mt-4 min-w-0\">
            <div
              className=\"p-6 sm:p-10 min-w-0\"
              style={{ background: LUX.paper, border: `1px solid ${LUX.hairline}`, borderRadius: '4px' }}
            >
              <div className=\"mb-6\">
                <Eyebrow className=\"mb-2\">Voices</Eyebrow>
                <h2 className=\"pdp-serif text-2xl sm:text-3xl font-medium\" style={{ color: LUX.onyx }}>
                  Ratings &amp; Reviews
                </h2>
              </div>

              {reviewsLoading ? (
                <div className=\"flex items-center justify-center py-12\">
                  <div className=\"w-7 h-7 border-2 rounded-full animate-spin\" style={{ borderColor: LUX.gold, borderTopColor: 'transparent' }} />
                </div>
              ) : totalReviews === 0 ? (
                <div className=\"text-center py-12\">
                  <FaCommentDots className=\"mx-auto mb-3\" size={32} style={{ color: LUX.hairline }} />
                  <p className=\"pdp-serif text-xl\" style={{ color: LUX.onyx }}>No reviews yet</p>
                  <p className=\"text-[13px] mt-1.5\" style={{ color: LUX.mute }}>Be the first to share your experience</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className=\"grid sm:grid-cols-[auto,1fr] gap-8 sm:gap-12 pb-8\" style={{ borderBottom: `1px solid ${LUX.hairline}` }}>
                    <div className=\"flex flex-col items-start sm:items-center justify-center sm:w-44 flex-shrink-0\">
                      <p className=\"pdp-serif font-medium leading-none\" style={{ color: LUX.onyx, fontSize: 'clamp(2.75rem, 7vw, 4rem)' }}>
                        {Number(data.avgRating || 0).toFixed(1)}
                        <span className=\"text-lg align-top font-light ml-1\" style={{ color: LUX.mute }}>/5</span>
                      </p>
                      <div className=\"flex gap-0.5 mt-3\">
                        {[1, 2, 3, 4, 5].map(s => (
                          s <= Math.round(data.avgRating || 0)
                            ? <FaStar key={s} size={18} style={{ color: LUX.gold }} />
                            : <FaRegStar key={s} size={18} style={{ color: LUX.hairline }} />
                        ))}
                      </div>
                      <p className=\"text-[12px] mt-3 flex items-center gap-1.5\" style={{ color: LUX.mute }}>
                        <FaCheckCircle size={11} style={{ color: LUX.emerald }} />
                        {totalReviews} Verified Rating{totalReviews !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className=\"flex flex-col gap-3 justify-center min-w-0\">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingDist[star] || 0
                        const pct = Math.round((count / maxDistCount) * 100)
                        const sharePct = totalReviews ? Math.round((count / totalReviews) * 100) : 0
                        return (
                          <div key={star} className=\"flex items-center gap-3 text-[13px]\">
                            <span className=\"flex items-center gap-1 w-10 flex-shrink-0 font-medium\" style={{ color: LUX.graphite }}>
                              {star} <FaStar size={10} style={{ color: LUX.gold }} />
                            </span>
                            <div className=\"flex-1 h-1.5 overflow-hidden min-w-0\" style={{ background: LUX.ivory, borderRadius: '999px' }}>
                              <div
                                className=\"h-full transition-all duration-700\"
                                style={{ width: `${pct}%`, background: LUX.onyx, borderRadius: '999px' }}
                              />
                            </div>
                            <span className=\"w-20 flex-shrink-0 text-right text-[11.5px]\" style={{ color: LUX.mute }}>
                              {count} ({sharePct}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className=\"flex items-center justify-between gap-3 flex-wrap mt-6 mb-4\">
                    <p className=\"pdp-serif text-lg\" style={{ color: LUX.onyx }}>
                      {totalReviews} Review{totalReviews !== 1 ? 's' : ''}
                    </p>
                    <div
                      className=\"flex items-center gap-1 p-1\"
                      style={{ background: LUX.ivory, border: `1px solid ${LUX.hairline}`, borderRadius: '999px' }}
                    >
                      {[
                        { key: 'recent', label: 'Recent' },
                        { key: 'highest', label: 'Highest' },
                        { key: 'lowest', label: 'Lowest' },
                      ].map(opt => {
                        const active = reviewSort === opt.key
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setReviewSort(opt.key)}
                            className=\"text-[11px] font-semibold tracking-[0.14em] uppercase px-3.5 py-1.5 transition-all\"
                            style={{
                              background: active ? LUX.onyx : 'transparent',
                              color: active ? LUX.goldLight : LUX.mute,
                              borderRadius: '999px',
                            }}
                            data-testid={`review-sort-${opt.key}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Review cards */}
                  <div className=\"grid gap-4 mt-2\">
                    {sortedReviews.map((r, i) => {
                      const reviewerName = r.userId?.name || r.name || r.userName || 'Anonymous Buyer'
                      const reviewText = r.comment || r.review || r.text || ''
                      const reviewDate = r.createdAt || r.date
                      return (
                        <div
                          key={r._id || i}
                          className=\"p-5 pdp-fade-up\"
                          style={{ background: LUX.cream, border: `1px solid ${LUX.hairline}`, borderRadius: '3px' }}
                          data-testid={`review-card-${i}`}
                        >
                          <div className=\"flex items-start justify-between gap-3 flex-wrap\">
                            <div className=\"flex items-center gap-3 min-w-0\">
                              <div
                                className=\"w-10 h-10 flex items-center justify-center flex-shrink-0\"
                                style={{ background: LUX.onyx, borderRadius: '50%' }}
                              >
                                <FaUserCircle size={22} style={{ color: LUX.goldLight }} />
                              </div>
                              <div className=\"min-w-0\">
                                <p className=\"text-[14px] font-semibold truncate pdp-serif\" style={{ color: LUX.onyx }}>
                                  {reviewerName}
                                </p>
                                <div className=\"flex items-center gap-2 mt-1 flex-wrap\">
                                  <div className=\"flex gap-0.5\">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      s <= Math.round(r.rating || 0)
                                        ? <FaStar key={s} size={11} style={{ color: LUX.gold }} />
                                        : <FaRegStar key={s} size={11} style={{ color: LUX.hairline }} />
                                    ))}
                                  </div>
                                  <span
                                    className=\"inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5\"
                                    style={{ background: LUX.paper, border: `1px solid ${LUX.goldLight}`, color: LUX.emerald, borderRadius: '2px' }}
                                  >
                                    <FaCheckCircle size={9} /> Verified
                                  </span>
                                </div>
                              </div>
                            </div>
                            {reviewDate && (
                              <span className=\"text-[11px] flex-shrink-0 tracking-wide\" style={{ color: LUX.mute }}>
                                {new Date(reviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {reviewText && (
                            <p className=\"text-[14px] leading-[1.8] mt-4 pdp-serif italic\" style={{ color: LUX.graphite }}>
                              <span style={{ color: LUX.gold, fontSize: '1.4em', lineHeight: 0, marginRight: 4 }}>“</span>
                              {reviewText}
                              <span style={{ color: LUX.gold, fontSize: '1.4em', lineHeight: 0, marginLeft: 4 }}>”</span>
                            </p>
                          )}
                          <button
                            className=\"flex items-center gap-1.5 text-[11px] font-medium mt-4 tracking-wide uppercase transition-colors\"
                            style={{ color: LUX.mute }}
                            onMouseEnter={e => e.currentTarget.style.color = LUX.onyx}
                            onMouseLeave={e => e.currentTarget.style.color = LUX.mute}
                          >
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
            <div className=\"col-span-1 lg:col-span-2 mt-10 min-w-0\">
              <YouMayAlsoLike productId={data._id} />
            </div>
          )}
          <div className=\"col-span-1 lg:col-span-2 min-w-0\">
            <RecentlyViewed />
          </div>
          {data?._id && (
            <div className=\"col-span-1 lg:col-span-2 mt-8 px-2 min-w-0\">
              <ProductQA productId={data._id} />
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default ProductDisplayPage
"
Observation: Create successful: /app/ProductDisplayPage.jsx