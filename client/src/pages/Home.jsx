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
  const [banners, setBanners] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getBanners })
        if (res.data.success && res.data.data.length > 0) {
          setBanners(res.data.data)
        } else {
          setBanners([{ image: bannerFallback, imageMobile: bannerMobileFallback, title: '', link: '', _id: 'fallback' }])
        }
      } catch {
        setBanners([{ image: bannerFallback, imageMobile: bannerMobileFallback, title: '', link: '', _id: 'fallback' }])
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [banners.length, next])

  if (loading) {
    return <div className='w-full min-h-48 bg-blue-100 rounded animate-pulse my-2'></div>
  }

  const banner = banners[current]

  const BannerImage = () => (
    <div className='relative w-full overflow-hidden rounded' style={{ minHeight: '150px' }}>
      {banner.link ? (
        <Link to={banner.link}>
          <img src={banner.image} className='w-full h-full object-cover hidden lg:block' alt={banner.title || 'banner'} />
          <img src={banner.imageMobile || banner.image} className='w-full h-full object-cover lg:hidden' alt={banner.title || 'banner'} />
        </Link>
      ) : (
        <>
          <img src={banner.image} className='w-full h-full object-cover hidden lg:block' alt={banner.title || 'banner'} />
          <img src={banner.imageMobile || banner.image} className='w-full h-full object-cover lg:hidden' alt={banner.title || 'banner'} />
        </>
      )}

      {/* Prev/Next arrows — only show when multiple banners */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors'
            aria-label='Previous banner'
          >
            ‹
          </button>
          <button
            onClick={next}
            className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors'
            aria-label='Next banner'
          >
            ›
          </button>

          {/* Dots */}
          <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5'>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )

  return <BannerImage />
}

const Home = () => {
  const loadingCategory = useSelector(state => state.product.loadingCategory)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const navigate = useNavigate()

  const handleRedirectProductListpage = (id, cat) => {
    const subcategory = subCategoryData.find(sub => sub.category.some(c => c._id == id))
    const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`
    navigate(url)
  }

  return (
    <section className='bg-white'>
      <div className='container mx-auto'>
        <BannerCarousel />
      </div>

      <div className='container mx-auto px-4 my-2 grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2'>
        {loadingCategory ? (
          new Array(12).fill(null).map((c, index) => (
            <div key={index + 'loadingcategory'} className='bg-white rounded p-4 min-h-36 grid gap-2 shadow animate-pulse'>
              <div className='bg-blue-100 min-h-24 rounded'></div>
              <div className='bg-blue-100 h-8 rounded'></div>
            </div>
          ))
        ) : (
          categoryData.map((cat, index) => (
            <div key={cat._id + 'displayCategory'} className='w-full h-full cursor-pointer' onClick={() => handleRedirectProductListpage(cat._id, cat.name)}>
              <div>
                <img src={cat.image} className='w-full h-full object-scale-down' alt={cat.name} />
              </div>
            </div>
          ))
        )}
      </div>

      {categoryData?.map((c, index) => (
        <CategoryWiseProductDisplay
          key={c?._id + 'CategorywiseProduct'}
          id={c?._id}
          name={c?.name}
        />
      ))}

      <RecentlyViewed />
    </section>
  )
}

export default Home
