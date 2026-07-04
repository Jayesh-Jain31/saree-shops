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
import { FaHeart, FaRegHeart, FaWhatsapp, FaLink, FaShareAlt, FaTruck, FaShieldAlt, FaMedal, FaBolt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaStar, FaRegStar, FaCheckDouble, FaTag, FaFire, FaLeaf, FaFeatherAlt, FaMagic, FaGem, FaCommentDots, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import AddToCartButton from '../components/AddToCartButton';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? <FaChevronUp size={12} className="text-gray-400" /> : <FaChevronDown size={12} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

const ProductDescriptionTabs = ({ data }) => {
  const details = data?.more_details || {};
  const hasDetails = Object.keys(details).length > 0;

  return (
    <div>
      {/* Amazon-style key-value rows */}
      {hasDetails ? (
        <div>
          <div className="flex items-center gap-4 px-4 pt-3 pb-2 border-b border-gray-200">
            <span className="text-sm font-bold text-orange-600 border-b-2 border-orange-600 pb-2">Details</span>
            <span className="text-sm font-medium text-gray-500 pb-2">Explore</span>
            <span className="text-sm font-medium text-gray-500 pb-2">Reviews</span>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {Object.entries(details).map(([key, val], i) => (
                <div key={i} className="flex items-start gap-2 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-500 min-w-[110px] flex-shrink-0">{key}</span>
                  <span className="text-sm text-gray-800">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-sm text-gray-400 text-center">No specifications available</p>
        </div>
      )}
    </div>
  );
};

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
  { icon: FaTruck, label: 'Cash on Delivery', sub: 'Available', bg: 'bg-orange-50', ic: 'text-orange-600' },
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
  
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);
  const variants = data.variants || [];
  const selectedVariant = selectedVariantIndex !== null ? variants[selectedVariantIndex] : null;

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

  const mainImageSrc = selectedVariant?.image 
      ? selectedVariant.image 
      : (data.image?.[image] || null);

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
    } catch (e) {}
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
    setSelectedVariantIndex(null);
    setImage(0);
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
  const displayStock = selectedVariant ? (selectedVariant.stock ?? 0) : data.stock;
  const isBestseller = (data.reviewCount || 0) >= 1 || data.avgRating >= 4;
  const totalReviews = reviews.length;
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'highest') return (b.rating || 0) - (a.rating || 0);
    if (reviewSort === 'lowest') return (a.rating || 0) - (b.rating || 0);
    return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans bg-gradient-to-b from-orange-50/30 to-white">
      <BackButton />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
        
        {/* ============ LEFT: IMAGES ============ */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg border border-orange-100/50 group">
            {mainImageSrc ? (
              <img 
                src={mainImageSrc} 
                alt={selectedVariant?.name || data.name} 
                className="w-full h-auto aspect-[3/4] object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-orange-50/50 flex items-center justify-center text-orange-300">
                <span className="text-sm">No Image</span>
              </div>
            )}
            
            {data.discount > 0 && !selectedVariant && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                {data.discount}% OFF
              </div>
            )}

            {selectedVariant && (
              <div className="absolut