import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleRight, FaAngleLeft } from "react-icons/fa6"
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaWhatsapp, FaLink, FaShareAlt } from 'react-icons/fa'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import image1 from '../assets/minute_delivery.png'
import image2 from '../assets/Best_Prices_Offers.png'
import image3 from '../assets/Wide_Assortment.png'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const addToRecentlyViewed = (product) => {
  try {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    const filtered = stored.filter(p => p._id !== product._id)
    filtered.unshift({
      _id: product._id,
      name: product.name,
      image: product.image?.[0],
      price: product.price,
      discount: product.discount,
      unit: product.unit,
    })
    localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)))
  } catch (e) {}
}

const StarRating = ({ rating, onRate, interactive = false, size = 16 }) => {
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          type='button'
        >
          {star <= rating
            ? <FaStar size={size} className='text-yellow-400' />
            : <FaRegStar size={size} className='text-gray-300' />
          }
        </button>
      ))}
    </div>
  )
}

const ProductDisplayPage = () => {
  const params = useParams()
  let productId = params?.product?.split("-")?.slice(-1)[0]
  const [data, setData] = useState({ name: "", image: [] })
  const [image, setImage] = useState(0)
  const [loading, setLoading] = useState(false)
  const imageContainer = useRef()
  const user = useSelector(state => state?.user)

  const [wishlisted, setWishlisted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const fetchProductDetails = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getProductDetails,
        data: { productId: productId }
      })
      const { data: responseData } = response
      if (responseData.success) {
        setData(responseData.data)
        addToRecentlyViewed(responseData.data)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getProductReviews, data: { productId } })
      if (response.data.success) {
        setReviews(response.data.data.reviews)
        setAvgRating(response.data.data.avgRating)
        setTotalReviews(response.data.data.totalReviews)
      }
    } catch (e) {}
  }

  const checkWishlist = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getWishlist })
      if (response.data.success) {
        const found = response.data.data.some(w => w.productId?._id === productId)
        setWishlisted(found)
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchProductDetails()
    fetchReviews()
    if (user?._id) checkWishlist()
  }, [params])

  const handleScrollRight = () => { imageContainer.current.scrollLeft += 100 }
  const handleScrollLeft = () => { imageContainer.current.scrollLeft -= 100 }

  const toggleWishlist = async () => {
    if (!user?._id) { toast.error('Please login first'); return }
    try {
      const response = await Axios({ ...SummaryApi.toggleWishlist, data: { productId: data._id } })
      if (response.data.success) {
        setWishlisted(response.data.data.added)
        toast.success(response.data.message)
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user?._id) { toast.error('Please login first'); return }
    if (!myRating) { toast.error('Please select a rating'); return }
    try {
      const response = await Axios({
        ...SummaryApi.addReview,
        data: { productId, rating: myRating, comment: myComment }
      })
      if (response.data.success) {
        toast.success(response.data.message)
        setShowReviewForm(false)
        setMyRating(0)
        setMyComment('')
        fetchReviews()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleShare = (type) => {
    const url = window.location.href
    if (type === 'copy') {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${data.name}: ${url}`)}`, '_blank')
    }
    setShowShareMenu(false)
  }

  return (
    <section className='container mx-auto p-4 grid lg:grid-cols-2'>
      <div className=''>
        <div className='bg-white lg:min-h-[65vh] lg:max-h-[65vh] rounded-2xl min-h-72 max-h-72 h-full w-full relative overflow-hidden flex items-center justify-center p-4'>
          <img src={data.image[image]} className='w-full h-full object-contain' />
          {/* Wishlist & Share buttons */}
          <div className='absolute top-3 right-3 flex gap-2'>
            <button
              onClick={toggleWishlist}
              className='w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform'
            >
              {wishlisted
                ? <FaHeart className='text-red-500' size={16} />
                : <FaRegHeart className='text-gray-400' size={16} />
              }
            </button>
            <div className='relative'>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className='w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform'
              >
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
        </div>
        <div className='flex items-center justify-center gap-3 my-2'>
          {data.image.map((img, index) => (
            <div key={img + index + "point"} className={`bg-slate-200 w-3 h-3 lg:w-5 lg:h-5 rounded-full ${index === image && "bg-slate-300"}`}></div>
          ))}
        </div>
        <div className='grid relative'>
          <div ref={imageContainer} className='flex gap-4 z-10 relative w-full overflow-x-auto scrollbar-none'>
            {data.image.map((img, index) => (
              <div className='w-20 h-20 min-h-20 min-w-20 cursor-pointer shadow-md' key={img + index}>
                <img src={img} alt='min-product' onClick={() => setImage(index)} className='w-full h-full object-scale-down' />
              </div>
            ))}
          </div>
          <div className='w-full -ml-3 h-full hidden lg:flex justify-between absolute items-center'>
            <button onClick={handleScrollLeft} className='z-10 bg-white relative p-1 rounded-full shadow-lg'><FaAngleLeft /></button>
            <button onClick={handleScrollRight} className='z-10 bg-white relative p-1 rounded-full shadow-lg'><FaAngleRight /></button>
          </div>
        </div>

        <div className='my-4 hidden lg:grid gap-3'>
          <div><p className='font-semibold'>Description</p><p className='text-base'>{data.description}</p></div>
          <div><p className='font-semibold'>Unit</p><p className='text-base'>{data.unit}</p></div>
          {data?.more_details && Object.keys(data?.more_details).map((element, index) => (
            <div key={index}><p className='font-semibold'>{element}</p><p className='text-base'>{data?.more_details[element]}</p></div>
          ))}
        </div>
      </div>

      <div className='p-4 lg:pl-7 text-base lg:text-lg'>
        <p className='bg-green-300 w-fit px-2 rounded-full'>10 Min</p>
        <h2 className='text-lg font-semibold lg:text-3xl'>{data.name}</h2>
        <p>{data.unit}</p>

        {/* Rating summary */}
        {totalReviews > 0 && (
          <div className='flex items-center gap-2 my-1'>
            <StarRating rating={Math.round(avgRating)} size={14} />
            <span className='text-sm text-gray-600'>{avgRating}</span>
            <span className='text-xs text-gray-400'>({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
          </div>
        )}

        <Divider />

        <div>
          <p>Price</p>
          <div className='flex items-center gap-2 lg:gap-4'>
            <div className='border border-green-600 px-4 py-2 rounded bg-green-50 w-fit'>
              <p className='font-semibold text-lg lg:text-xl'>{DisplayPriceInRupees(pricewithDiscount(data.price, data.discount))}</p>
            </div>
            {data.discount && <p className='line-through'>{DisplayPriceInRupees(data.price)}</p>}
            {data.discount && <p className="font-bold text-green-600 lg:text-2xl">{data.discount}% <span className='text-base text-neutral-500'>Discount</span></p>}
          </div>
        </div>

        {/* Stock Warning */}
        {data.stock > 0 && data.stock <= 5 && (
          <div className='my-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700 font-medium'>
            Hurry! Only {data.stock} left in stock
          </div>
        )}

        {data.stock === 0 ? (
          <p className='text-lg text-red-500 my-2'>Out of Stock</p>
        ) : (
          <div className='my-4'>
            <AddToCartButton data={data} />
          </div>
        )}

        <h2 className='font-semibold'>Why shop from binkeyit?</h2>
        <div>
          <div className='flex items-center gap-4 my-4'>
            <img src={image1} alt='superfast delivery' className='w-20 h-20' />
            <div className='text-sm'>
              <div className='font-semibold'>Superfast Delivery</div>
              <p>Get your order delivered to your doorstep at the earliest from dark stores near you.</p>
            </div>
          </div>
          <div className='flex items-center gap-4 my-4'>
            <img src={image2} alt='Best prices offers' className='w-20 h-20' />
            <div className='text-sm'>
              <div className='font-semibold'>Best Prices & Offers</div>
              <p>Best price destination with offers directly from the manufacturers.</p>
            </div>
          </div>
          <div className='flex items-center gap-4 my-4'>
            <img src={image3} alt='Wide Assortment' className='w-20 h-20' />
            <div className='text-sm'>
              <div className='font-semibold'>Wide Assortment</div>
              <p>Choose from 5000+ products across food personal care, household & other categories.</p>
            </div>
          </div>
        </div>

        {/* Mobile description */}
        <div className='my-4 grid gap-3 lg:hidden'>
          <div><p className='font-semibold'>Description</p><p className='text-base'>{data.description}</p></div>
          <div><p className='font-semibold'>Unit</p><p className='text-base'>{data.unit}</p></div>
          {data?.more_details && Object.keys(data?.more_details).map((element, index) => (
            <div key={index}><p className='font-semibold'>{element}</p><p className='text-base'>{data?.more_details[element]}</p></div>
          ))}
        </div>

        {/* Reviews Section */}
        <Divider />
        <div className='my-4'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='font-semibold text-lg'>Reviews & Ratings</h2>
            {user?._id && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className='text-sm text-green-600 font-semibold hover:underline'
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className='bg-gray-50 border rounded-xl p-4 mb-4'>
              <p className='text-sm font-medium mb-2'>Your Rating</p>
              <StarRating rating={myRating} onRate={setMyRating} interactive={true} size={24} />
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder='Write your review (optional)...'
                className='w-full mt-3 border rounded-lg p-3 text-sm focus:outline-none focus:border-green-500 resize-none'
                rows={3}
              />
              <button
                onClick={handleSubmitReview}
                className='mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700'
              >
                Submit Review
              </button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className='text-sm text-gray-400'>No reviews yet. Be the first to review!</p>
          ) : (
            <div className='space-y-3'>
              {reviews.slice(0, 5).map((review) => (
                <div key={review._id} className='bg-gray-50 rounded-xl p-3'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700'>
                      {review.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className='text-sm font-medium text-gray-700'>{review.userId?.name || 'User'}</span>
                    <StarRating rating={review.rating} size={12} />
                  </div>
                  {review.comment && <p className='text-sm text-gray-600 ml-9'>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProductDisplayPage
