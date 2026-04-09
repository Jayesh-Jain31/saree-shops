import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { setAllCategory } from '../store/productSlice'
import { valideURLConvert } from '../utils/valideURLConvert'
import { Link, useNavigate } from 'react-router-dom'
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay'
import RecentlyViewed from '../components/RecentlyViewed'
import FlashSaleCountdown from '../components/FlashSaleCountdown'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import bannerFallback from '../assets/banner.jpg'
import bannerMobileFallback from '../assets/banner-mobile.jpg'

const BannerCarousel = () => {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getBanners })
        if (res.data.success && res.data.data.length > 0) {
          const allSlides = []
          for (const banner of res.data.data) {
            if (banner.slides && banner.slides.length > 0) {
              allSlides.push(...banner.slides)
            } else if (banner.image) {
              allSlides.push({
                image: banner.image,
                imageMobile: banner.imageMobile || '',
                title: banner.title || '',
                link: banner.link || '',
              })
            }
          }
          if (allSlides.length > 0) {
            setSlides(allSlides)
          } else {
            setSlides([{ image: bannerFallback, imageMobile: bannerMobileFallback, title: '', link: '' }])
          }
        } else {
          setSlides([{ image: bannerFallback, imageMobile: bannerMobileFallback, title: '', link: '' }])
        }
      } catch {
        setSlides([{ image: bannerFallback, imageMobile: bannerMobileFallback, title: '', link: '' }])
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [slides.length, next])

  if (loading) {
    return (
      <div className='w-full rounded-2xl overflow-hidden my-3 mx-3 lg:mx-0' style={{ height: '180px' }}>
        <div className='w-full h-full bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 animate-pulse' />
      </div>
    )
  }

  const slide = slides[current]

  return (
    <div className='relative w-full overflow-hidden rounded-2xl my-3 shadow group' style={{ minHeight: '150px' }}>
      <div key={current} style={{ animation: 'heroFadeIn 0.4s ease' }}>
        {slide.link ? (
          <Link to={slide.link} className='block w-full'>
            <img src={slide.image} className='w-full object-cover hidden lg:block' style={{ maxHeight: '420px' }} alt={slide.title || 'banner'} />
            <img src={slide.imageMobile || slide.image} className='w-full object-cover lg:hidden' alt={slide.title || 'banner'} />
          </Link>
        ) : (
          <>
            <img src={slide.image} className='w-full object-cover hidden lg:block' style={{ maxHeight: '420px' }} alt={slide.title || 'banner'} />
            <img src={slide.imageMobile || slide.image} className='w-full object-cover lg:hidden' alt={slide.title || 'banner'} />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className='absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none' />
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 text-xl font-bold'
            aria-label='Previous'
          >‹</button>
          <button
            onClick={next}
            className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/85 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 text-xl font-bold'
            aria-label='Next'
          >›</button>
        </>
      )}

      {slides.length > 1 && (
        <div className='absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5'>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={'rounded-full transition-all duration-300 ' + (i === current ? 'w-6 h-2 bg-white shadow' : 'w-2 h-2 bg-white/55 hover:bg-white/80')}
              aria-label={'Slide ' + (i + 1)}
            />
          ))}
        </div>
      )}

      <style>{'@keyframes heroFadeIn { from { opacity: 0.75; transform: scale(1.015); } to { opacity: 1; transform: scale(1); } }'}</style>
    </div>
  )
}
const Home = () => {
  const loadingCategory = useSelector(state => state.product.loadingCategory)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  useEffect(() => {
  const fetchCategory = async () => {
    try {
      const res = await Axios({ ...SummaryApi.getCategory })
      if (res.data.success) {
        dispatch(setAllCategory(res.data.data))
      }
    } catch (error) {
      console.log(error)
    }
  }

  fetchCategory()
}, [])

  // Only show categories that have showOnHome !== false (default true for existing ones)
  const visibleCategories = categoryData.filter(c => c.showOnHome !== false)

  const handleRedirectProductListpage = (id, cat) => {
    const subcategory = subCategoryData.find(sub => sub.category.some(c => c._id == id))
    if (!subcategory) return
    const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`
    navigate(url)
  }

  return (
    <section className='bg-white'>
      {/* Flash Sale Countdown Strip — appears above banner when active */}
      <FlashSaleCountdown />

      <div className='container mx-auto'>
        <BannerCarousel />
      </div>

      <div className='container mx-auto px-4 mt-4 mb-1'>
        <div className='flex items-center gap-3'>
          <h2 className='font-bold text-gray-800 text-base'>Shop by Category</h2>
          <div className='flex-1 h-px bg-gray-100'></div>
        </div>
      </div>

      <div className='container mx-auto px-4 mt-2 mb-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'>
        {loadingCategory ? (
          new Array(6).fill(null).map((_, index) => (
            <div key={index + 'loadingcategory'} className='bg-white rounded-2xl p-3 grid gap-2 shadow animate-pulse'>
              <div className='bg-blue-100 aspect-square rounded-xl'></div>
              <div className='bg-blue-100 h-4 rounded w-3/4 mx-auto'></div>
            </div>
          ))
        ) : (
<>
            {visibleCategories.slice(0, 5).map((cat) => (
              <div
                key={cat._id + 'displayCategory'}
                className='cursor-pointer flex flex-col items-center gap-2 group'
                onClick={() => handleRedirectProductListpage(cat._id, cat.name)}
              >
                <div className='w-full aspect-square bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center p-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200'>
                  <img
                    src={cat.image}
                    className='w-full h-full object-contain'
                    alt={cat.name}
                  />
                </div>
                <p className='text-center text-xs sm:text-sm font-semibold text-gray-700 leading-tight line-clamp-2 w-full'>
                  {cat.name}
                </p>
              </div>
            ))}
            <Link
              to='/categories'
              className='cursor-pointer flex flex-col items-center gap-2 group'
            >
              {/* 2×2 collage tile */}
              <div className='w-full aspect-square rounded-2xl overflow-hidden relative group-hover:scale-105 group-hover:shadow-lg transition-all duration-200'>
                {/* 4 mini category images */}
                <div className='w-full h-full grid grid-cols-2 grid-rows-2'>
                  {visibleCategories.slice(0, 4).map((cat, i) => (
                    <div key={i} className='overflow-hidden'>
                      <img src={cat.image} alt={cat.name} className='w-full h-full object-cover' />
                    </div>
                  ))}
                </div>
                {/* Gradient overlay */}
                <div className='absolute inset-0' style={{ background: 'linear-gradient(160deg, rgba(236,72,153,0.72) 0%, rgba(168,85,247,0.72) 100%)' }} />
                {/* Centered text */}
                <div className='absolute inset-0 flex flex-col items-center justify-center gap-1'>
                  <div className='w-8 h-8 rounded-full bg-white/25 flex items-center justify-center mb-0.5'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' fill='none' viewBox='0 0 24 24' stroke='white' strokeWidth={2.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h16' />
                    </svg>
                  </div>
                  <span className='text-white font-bold text-[11px] sm:text-xs leading-tight text-center px-1'>View All</span>
                  <span className='text-white/80 text-[9px] sm:text-[10px] leading-tight text-center px-1'>Categories</span>
                </div>
              </div>
              <p className='text-center text-xs sm:text-sm font-bold leading-tight w-full' style={{ color: 'var(--primary, #ec4899)' }}>
                View All
              </p>
            </Link>
          </>
        )}
      </div>

      {visibleCategories.map((c) => (
        <CategoryWiseProductDisplay key={c._id + 'CategorywiseProduct'} id={c._id} name={c.name} />
      ))}

      <RecentlyViewed />
    </section>
  )
}

export default Home
