import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ProductQA from '../components/ProductQA';
import YouMayAlsoLike from '../components/YouMayAlsoLike';
import RecentlyViewed from '../components/RecentlyViewed';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import { FaAngleRight, FaAngleLeft, FaXmark, FaExpand } from 'react-icons/fa6';
import { FaHeart, FaRegHeart, FaWhatsapp, FaLink, FaShareAlt, FaTruck, FaShieldAlt, FaMedal, FaBolt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaPalette, FaStar, FaRegStar, FaBell, FaCheckDouble, FaTag, FaFire, FaLeaf, FaFeatherAlt, FaMagic, FaGem, FaUserCircle, FaThumbsUp, FaCommentDots } from 'react-icons/fa';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import AddToCartButton from '../components/AddToCartButton';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const addToRecentlyViewed = (product) => {
  try {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = stored.filter(p => p._id !== product._id);
    filtered.unshift({
      _id: product._id,
      name: product.name,
      image: product.image?.[0],
      price: product.price,
      discount: product.discount,
      unit: product.unit,
    });
    localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)));
  } catch (e) {}
};

const TRUST_BADGES = [
  { icon: FaTruck, label: 'Cash on Delivery', sub: 'Available', bg: 'bg-rose-50', ic: 'text-rose-600' },
  { icon: FaShieldAlt, label: 'Secure Payment', sub: '100% Safe', bg: 'bg-blue-50', ic: 'text-blue-600' },
  { icon: FaMedal, label: 'High Quality', sub: 'Assured', bg: 'bg-amber-50', ic: 'text-amber-600' },
  { icon: FaBolt, label: 'Fast Delivery', sub: 'On Time', bg: 'bg-indigo-50', ic: 'text-indigo-600' },
];

const LOVE_FEATURES = [
  { icon: FaLeaf, label: 'Soft & Smooth' },
  { icon: FaMagic, label: 'Vibrant Colors' },
  { icon: FaFeatherAlt, label: 'Lightweight' },
  { icon: FaGem, label: 'Premium Quality' },
];

const ProductDisplayPage = () => {
  const params = useParams();
  const productId = params?.product?.split('-')?.slice(-1)[0];
  const [data, setData] = useState({ name: '', image: [] });
  const [image, setImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [, setLoading] = useState(false);
  const imageContainer = useRef();
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const lastTap = useRef(0);
  const lastTouches = useRef(null);
  const isPinching = useRef(false);
  const panStart = useRef(null);
  const user = useSelector(state => state?.user);
  const [wishlisted, setWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [ratingDist, setRatingDist] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSort, setReviewSort] = useState('recent');
  const [viewingCount, setViewingCount] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const siteSettings = useSelector(state => state.site.settings);
  const outsideDeliveryTime = siteSettings?.outside_delivery_time || '3-4 days';

  const fetchProductDetails = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getProductDetails,
        data: { productId }
      });
      if (response.data.success) {
        setData(response.data.data);
        addToRecentlyViewed(response.data.data);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewDist = async () => {
    setReviewsLoading(true);
    try {
      const res = await Axios({
        ...SummaryApi.getProductReviews,
        data: { productId }
      });
      if (res.data.success) {
        const list = res.data.data?.reviews || [];
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        list.forEach(r => {
          const star = Math.round(r.rating);
          if (star >= 1 && star <= 5) dist[star]++;
        });
        setRatingDist(dist);
        setReviews(list);
      }
    } catch {}
    finally { setReviewsLoading(false); }
  };

  const checkWishlist = async () => {
    try {
      const res = await Axios({ ...SummaryApi.getWishlist });
      if (res.data.success) setWishlisted(res.data.data.some(w => w.productId?._id === productId));
    } catch (e) {}
  };

  useEffect(() => {
    if (!productId) return;
    const seed = productId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    setViewingCount(8 + (seed % 16));
    const iv = setInterval(() => {
      setViewingCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(4, Math.min(32, prev + delta));
      });
    }, 12000);
    return () => clearInterval(iv);
  }, [productId]);

  useEffect(() => {
    setSelectedVariant(null);
    setRatingDist({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setReviews([]);
    fetchProductDetails();
    fetchReviewDist();
    if (user?._id) checkWishlist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [params]);

  useEffect(() => {
    if (!data.image || data.image.length <= 1) return;
    const iv = setInterval(() => setImage(prev => (prev + 1) % data.image.length), 4500);
    return () => clearInterval(iv);
  }, [data.image]);

  useEffect(() => {
    if (data._id) setNotifyRequested(!!localStorage.getItem(`notify_stock_${data._id}`));
  }, [data._id]);

  const handleCheckPincode = async () => {
    const cleaned = pincode.trim();
    if (!cleaned || cleaned.length < 6) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    setCheckingPincode(true);
    try {
      const res = await Axios({
        ...SummaryApi.checkPincode,
        data: { pincode: cleaned }
      });
      if (res.data.success) {
        setPincodeResult(res.data.data);
      } else {
        toast.error(res.data.message || 'Pincode not serviceable');
        setPincodeResult(null);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
    setShowShareMenu(false);
  };

  const toggleWishlist = async () => {
    if (!user?._id) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const res = await Axios({
        ...(wishlisted ? SummaryApi.removeFromWishlist : SummaryApi.addToWishlist),
        data: { productId }
      });
      if (res.data.success) {
        setWishlisted(!wishlisted);
        toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  const displayPrice = selectedVariant ? selectedVariant.price : pricewithDiscount(data.price, data.discount);
  const displayStock = selectedVariant ? selectedVariant.stock : data.stock;
  const variants = data.variants || [];
  const isBestseller = (data.reviewCount || 0) >= 1 || data.avgRating >= 4;
  const totalReviews = reviews.length;
  const maxDistCount = Math.max(1, ...Object.values(ratingDist));
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return (b.rating || 0) - (a.rating || 0);
    if (reviewSort === 'lowest') return (a.rating || 0) - (b.rating || 0);
    return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans bg-gradient-to-b from-rose-50/30 to-white">
      <BackButton />

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
        
        {/* ============ LEFT: IMAGES ============ */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg border border-rose-100/50 group">
            {data.image?.[image] ? (
              <img 
                src={data.image[image]} 
                alt={data.name} 
                className="w-full h-auto aspect-square object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full aspect-square bg-rose-50/50 flex items-center justify-center text-rose-300">
                <span className="text-sm">No Image</span>
              </div>
            )}
            
            {/* Discount Badge */}
            {data.discount > 0 && !selectedVariant && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                {data.discount}% OFF
              </div>
            )}

            {/* Wishlist Button */}
            <button 
              onClick={toggleWishlist}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border border-rose-100 z-10 hover:shadow-rose-200/50"
            >
              {wishlisted ? <FaHeart className="text-rose-500 text-lg" /> : <FaRegHeart className="text-gray-600 text-lg" />}
            </button>

            {/* Share Button */}
            <div className="absolute bottom-4 right-4 z-10">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border border-rose-100 hover:shadow-rose-200/50"
              >
                <FaShareAlt className="text-gray-600 text-sm" />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-12 right-0 bg-white rounded-xl shadow-2xl border border-rose-100 p-1.5 min-w-[140px] z-20">
                  <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 rounded-lg text-sm text-gray-700 transition-colors">
                    <FaWhatsapp className="text-green-500" /> WhatsApp
                  </button>
                  <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 rounded-lg text-sm text-gray-700 transition-colors">
                    <FaLink className="text-blue-500" /> Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button 
              onClick={() => setLightboxOpen(true)} 
              className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold pl-2.5 pr-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all duration-300 border border-rose-100"
            >
              <FaExpand className="text-xs" /> View full screen
            </button>

            {/* Image Counter */}
            {data.image.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {data.image.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === image ? 'bg-white w-4' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {data.image.length > 1 && (
            <div className="relative">
              <div ref={imageContainer} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
                {data.image.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImage(index)}
                    className={`w-20 h-20 min-w-[80px] rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${index === image ? 'border-rose-500 ring-2 ring-rose-200 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-rose-300'}`}
                  >
                    <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => imageContainer.current.scrollLeft -= 120} 
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-rose-100 hover:bg-rose-50 transition-colors"
              >
                <FaAngleLeft className="text-gray-600 text-sm" />
              </button>
              <button 
                onClick={() => imageContainer.current.scrollLeft += 120} 
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-rose-100 hover:bg-rose-50 transition-colors"
              >
                <FaAngleRight className="text-gray-600 text-sm" />
              </button>
            </div>
          )}

          {/* Description — Desktop */}
          {data.description && (
            <div className="hidden lg:block bg-white p-6 rounded-2xl border border-rose-100/50 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{data.description}</p>
              {data?.more_details && Object.keys(data.more_details).map((el, i) => (
                <div key={i} className="mt-3 flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-700 min-w-[100px]">{el}:</span>
                  <span className="text-gray-600">{data.more_details[el]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ RIGHT: INFO ============ */}
        <div className="space-y-6">
          {/* Bestseller Badge */}
          {isBestseller && (
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              <FaFire className="text-amber-500" /> Bestseller
            </div>
          )}

          {/* Product Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">{data.name}</h1>
          
          {data.unit && (
            <p className="text-sm text-gray-500 -mt-2">{data.unit}</p>
          )}

          {/* Rating & Views */}
          <div className="flex items-center gap-4 flex-wrap">
            {data.avgRating > 0 && (
              <button 
                onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} 
                className="flex items-center gap-2 group"
              >
                <span className="text-lg font-bold text-gray-800">{Number(data.avgRating).toFixed(1)}</span>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map(s => (
                    s <= Math.round(data.avgRating) ? <FaStar key={s} className="text-sm" /> : <FaRegStar key={s} className="text-sm" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 group-hover:text-rose-500 transition-colors">
                  ({data.reviewCount || totalReviews} rating{(data.reviewCount || totalReviews) !== 1 ? 's' : ''})
                </span>
              </button>
            )}
            {viewingCount > 0 && (
              <span className="text-xs text-rose-500 bg-rose-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                {viewingCount} people are viewing
              </span>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Select Variant</span>
                {selectedVariant && <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">— {selectedVariant.name}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(selectedVariant?.name === v.name ? null : v)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-300 ${selectedVariant?.name === v.name ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200' : 'border-gray-200 text-gray-700 bg-white hover:border-rose-300 hover:shadow-md'}`}
                  >
                    {v.name} {v.price ? `· ₹{v.price}` : ''}
                  </button>
                ))}
              </div>
              {selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock <= 5 && (
                <p className="text-xs text-rose-500 font-medium">⚠️ Only {selectedVariant.stock} left in this variant</p>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-800">{DisplayPriceInRupees(displayPrice)}</span>
            {!selectedVariant && data.discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{DisplayPriceInRupees(data.price)}</span>
                <span className="text-sm font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{data.discount}% OFF</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 -mt-1">Inclusive of all taxes</p>

          {/* Stock Status & Add to Cart */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            {displayStock > 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
                <FaCheckCircle /> In Stock
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600 text-sm font-medium bg-rose-50 px-3 py-1.5 rounded-full">
                <FaTimesCircle /> Out of Stock
              </span>
            )}
            
            {displayStock > 0 && displayStock <= 5 && (
              <span className="text-xs text-rose-500 font-medium bg-rose-50 px-3 py-1 rounded-full">🔥 Hurry! Only {displayStock} left</span>
            )}
          </div>

          {displayStock > 0 ? (
            <AddToCartButton data={{ ...data, price: displayPrice, stock: displayStock, variant: selectedVariant }} />
          ) : (
            <div className="space-y-3">
              <button disabled className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed">
                Out of Stock
              </button>
              {notifyRequested ? (
                <div className="text-center text-sm text-emerald-600 bg-emerald-50 p-2 rounded-xl flex items-center justify-center gap-2">
                  <FaCheckDouble /> You're on the notify list! We'll let you know.
                </div>
              ) : (
                <button 
                  onClick={() => {
                    localStorage.setItem(`notify_stock_${data._id}`, 'true');
                    setNotifyRequested(true);
                    toast.success('You will be notified when back in stock!');
                  }}
                  className="w-full py-3 border-2 border-rose-500 text-rose-500 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
                >
                  Notify Me When Back in Stock
                </button>
              )}
            </div>
          )}

          {/* Delivery Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl">
              <FaTruck className="text-rose-400" /> 2-3 days delivery
            </div>
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl">
              <FaShieldAlt className="text-rose-400" /> Cash on Delivery
            </div>
          </div>

          {/* Offers */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200/50">
            <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <FaTag className="text-amber-600" /> Offers for you
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Get extra 5% off on prepaid orders</li>
              <li>Use code SAVE10 & get 10% off</li>
            </ul>
          </div>

          {/* Pincode Check */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <FaMapMarkerAlt className="text-rose-400" /> Check Delivery for Your Area
            </h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={pincode} 
                onChange={(e) => { setPincode(e.target.value); setPincodeResult(null); }} 
                onKeyDown={e => e.key === 'Enter' && handleCheckPincode()} 
                maxLength={6} 
                placeholder="Enter 6-digit pincode" 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition" 
              />
              <button 
                onClick={handleCheckPincode} 
                disabled={checkingPincode} 
                className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-70"
              >
                {checkingPincode ? 'Checking...' : 'Check'}
              </button>
            </div>
            {!pincodeResult && (
              <p className="text-xs text-gray-400 mt-2">Enter pincode to check delivery availability</p>
            )}
            {pincodeResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm ${pincodeResult.available ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                {pincodeResult.available ? (
                  <div>
                    <p className="font-semibold text-emerald-700 flex items-center gap-1.5"><FaCheckCircle /> Delivery Available!</p>
                    <p className="text-emerald-600 text-xs">Estimated: {pincodeResult.estimatedTime}{pincodeResult.zoneName ? ` · ${pincodeResult.zoneName}` : ''}</p>
                    <p className="text-emerald-600 text-xs">{pincodeResult.deliveryCharge === 0 ? '✨ Free Delivery' : `Delivery: ₹${pincodeResult.deliveryCharge}`}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-rose-700 flex items-center gap-1.5"><FaTimesCircle /> Standard Delivery</p>
                    <p className="text-rose-600 text-xs">Estimated: {outsideDeliveryTime}</p>
                    <p className="text-rose-600 text-xs">Charges may apply</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Why You'll Love This */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Why you'll love this</h4>
            <div className="grid grid-cols-2 gap-2">
              {LOVE_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                  <Icon className="text-rose-400 text-sm" />
                  <span className="text-xs text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-2">
            {TRUST_BADGES.map(({ icon: Icon, label, sub, bg, ic }) => (
              <div key={label} className={`flex items-center gap-2 p-2.5 rounded-xl ${bg} border border-rose-100/30`}>
                <Icon className={`${ic} text-sm`} />
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-[10px] text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Description */}
          {data.description && (
            <div className="lg:hidden bg-white p-5 rounded-2xl border border-rose-100/50 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{data.description}</p>
              {data?.more_details && Object.keys(data.more_details).map((el, i) => (
                <div key={i} className="mt-3 flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-700 min-w-[100px]">{el}:</span>
                  <span className="text-gray-600">{data.more_details[el]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ REVIEWS SECTION ============ */}
      <div id="reviews-section" className="mt-16 pt-8 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaCommentDots className="text-rose-400" /> Customer Reviews
            <span className="text-sm font-normal text-gray-500">({totalReviews})</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select 
              value={reviewSort} 
              onChange={(e) => setReviewSort(e.target.value)} 
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-rose-100/50 shadow-sm mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <span className="text-4xl font-bold text-gray-800">{data.avgRating ? Number(data.avgRating).toFixed(1) : '0'}</span>
              <div className="flex text-amber-400 justify-center mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  s <= Math.round(data.avgRating || 0) ? <FaStar key={s} className="text-sm" /> : <FaRegStar key={s} className="text-sm" />
                ))}
              </div>
              <span className="text-xs text-gray-500">{totalReviews} ratings</span>
            </div>
            <div className="flex-1 space-y-1.5 min-w-[150px]">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-6">{star}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${totalReviews > 0 ? (ratingDist[star] / totalReviews) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{ratingDist[star]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="text-center py-8 text-gray-400">Loading reviews...</div>
        ) : sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-rose-100/50 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-semibold">
                      {review.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{review.user?.name || 'Anonymous'}</p>
                      <div className="flex text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map(s => (
                          s <= Math.round(review.rating) ? <FaStar key={s} /> : <FaRegStar key={s} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(review.createdAt || review.date).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-sm text-gray-600 mt-2">{review.comment}</p>}
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <img key={i} src={img} alt={`Review ${i}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-rose-100/50">No reviews yet. Be the first to review!</div>
        )}
      </div>

      {/* ============ YOU MAY ALSO LIKE ============ */}
      <YouMayAlsoLike currentProductId={data._id} />

      {/* ============ RECENTLY VIEWED ============ */}
      <RecentlyViewed />

      {/* ============ PRODUCT Q&A ============ */}
      <ProductQA productId={data._id} />

      {/* ============ LIGHTBOX ============ */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => { setLightboxOpen(false); setZoom(1); setPanX(0); setPanY(0); }}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={data.image[image]} 
              alt={data.name} 
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)` }}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  isPinching.current = true;
                  lastTouches.current = e.touches;
                } else if (e.touches.length === 1) {
                  isPinching.current = false;
                  if (zoom > 1) panStart.current = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
                  const now = Date.now();
                  if (now - lastTap.current < 300) {
                    setZoom(z => { if (z > 1) { setPanX(0); setPanY(0); return 1; } return 2.5; });
                  }
                  lastTap.current = now;
                }
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (isPinching.current && e.touches.length === 2) {
                  const t1 = e.touches[0];
                  const t2 = e.touches[1];
                  const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                  const lastDist = Math.hypot(lastTouches.current[0].clientX - lastTouches.current[1].clientX, lastTouches.current[0].clientY - lastTouches.current[1].clientY);
                  const newZoom = Math.min(4, Math.max(1, zoom * (dist / lastDist)));
                  setZoom(newZoom);
                  lastTouches.current = e.touches;
                } else if (!isPinching.current && zoom > 1 && e.touches.length === 1 && panStart.current) {
                  setPanX(e.touches[0].clientX - panStart.current.x);
                  setPanY(e.touches[0].clientY - panStart.current.y);
                }
              }}
              onTouchEnd={() => { isPinching.current = false; panStart.current = null; }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(z => Math.min(4, Math.max(1, z + delta)));
              }}
            />
            <button 
              onClick={() => { setLightboxOpen(false); setZoom(1); setPanX(0); setPanY(0); }} 
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <FaXmark className="text-xl" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/30 px-4 py-1.5 rounded-full">
              {image + 1} / {data.image.length}
            </div>
            {zoom > 1 && (
              <button 
                onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} 
                className="absolute bottom-4 right-4 text-white/60 text-xs border border-white/30 rounded-full px-3 py-1 hover:bg-white/10 transition"
              >
                Reset Zoom
              </button>
            )}
            <button 
              onClick={() => setImage((prev) => (prev - 1 + data.image.length) % data.image.length)} 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <FaAngleLeft className="text-xl" />
            </button>
            <button 
              onClick={() => setImage((prev) => (prev + 1) % data.image.length)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <FaAngleRight className="text-xl" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ProductDisplayPage;