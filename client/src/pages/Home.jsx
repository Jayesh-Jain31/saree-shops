import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import { Link, useNavigate } from 'react-router-dom'
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay'
import RecentlyViewed from '../components/RecentlyViewed'
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
          // Flatten all banner slides into one carousel
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
    return <div className='w-full min-h-48 bg-blue-100 rounded animate-pulse my-2'></div>
  }

  const slide = slides[current]

  const ImageContent = () => (
    <>
      <img src={slide.image} className='w-full h-full object-cover hidden lg:block' alt={slide.title || 'banner'} />
      <img src={slide.imageMobile || slide.image} className='w-full h-full object-cover lg:hidden' alt={slide.title || 'banner'} />
    </>
  )

  return (
    <div className='relative w-full overflow-hidden rounded' style={{ minHeight: '150px' }}>
      {slide.link ? (
        <Link to={slide.link}><ImageContent /></Link>
      ) : (
        <ImageContent />
      )}

      {/* Prev/Next — only when multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors text-lg font-bold'
            aria-label='Previous'
          >‹</button>
          <button
            onClick={next}
            className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors text-lg font-bold'
            aria-label='Next'
          >›</button>

          {/* Dot indicators */}
          <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5'>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const Home = () => {
  const loadingCategory = useSelector(state => state.product.loadingCategory)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const navigate = useNavigate()

  const handleRedirectProductListpage = (id, cat) => {
    const subcategory = subCategoryData.find(sub => sub.category.some(c => c._id == id))
    if (!subcategory) return
    const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`
    navigate(url)
  }

  return (
    <section className='bg-white'>
      <div className='container mx-auto'>
        <BannerCarousel />
      </div>

      <div className='container mx-auto px-4 my-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'>
        {loadingCategory ? (
          new Array(6).fill(null).map((_, index) => (
            <div key={index + 'loadingcategory'} className='bg-white rounded-2xl p-3 grid gap-2 shadow animate-pulse'>
              <div className='bg-blue-100 aspect-square rounded-xl'></div>
              <div className='bg-blue-100 h-4 rounded w-3/4 mx-auto'></div>
            </div>
          ))
        ) : (
          categoryData.map((cat) => (
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
          ))
        )}
      </div>

      {categoryData?.map((c) => (
        <CategoryWiseProductDisplay key={c?._id + 'CategorywiseProduct'} id={c?._id} name={c?.name} />
      ))}

      <RecentlyViewed />
    </section>
  )
}

export default Home
