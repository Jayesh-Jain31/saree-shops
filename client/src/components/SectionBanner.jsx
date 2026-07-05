import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const SectionBanner = ({ placement = 'section-1', className = '' }) => {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await Axios({
          ...SummaryApi.getBannersByPlacement,
          params: { placement }
        })
        if (res.data.success && res.data.data.length > 0) {
          const allSlides = []
          for (const banner of res.data.data) {
            // Safety: skip banners that don't match the requested placement
            if (banner.placement && banner.placement !== placement && banner.placement !== 'hero') continue
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
          setSlides(allSlides)
        } else {
          setSlides([])
        }
      } catch {
        setSlides([])
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [placement])

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [slides.length, next])

  if (loading) {
    return (
      <div className={`w-full rounded-2xl overflow-hidden shadow-sm my-2 ${className}`} style={{ height: '180px' }}>
        <div className='w-full h-full bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 animate-pulse' />
      </div>
    )
  }

  if (slides.length === 0) return null

  const slide = slides[current]

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl shadow-md group my-2 ${className}`}>
      <div key={current} className='transition-opacity duration-500'>
        {slide.link ? (
          <Link to={slide.link} className='block w-full'>
            <img
              src={slide.image}
              className='w-full object-cover hidden md:block'
              style={{ maxHeight: '320px', minHeight: '180px' }}
              alt={slide.title || 'banner'}
              loading='lazy'
            />
            <img
              src={slide.imageMobile || slide.image}
              className='w-full object-cover md:hidden'
              style={{ maxHeight: '220px', minHeight: '140px' }}
              alt={slide.title || 'banner'}
              loading='lazy'
            />
          </Link>
        ) : (
          <>
            <img
              src={slide.image}
              className='w-full object-cover hidden md:block'
              style={{ maxHeight: '320px', minHeight: '180px' }}
              alt={slide.title || 'banner'}
              loading='lazy'
            />
            <img
              src={slide.imageMobile || slide.image}
              className='w-full object-cover md:hidden'
              style={{ maxHeight: '220px', minHeight: '140px' }}
              alt={slide.title || 'banner'}
              loading='lazy'
            />
          </>
        )}
      </div>

      {/* Bottom gradient for dots visibility */}
      {slides.length > 1 && (
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none' />
      )}

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 text-xl font-bold'
            aria-label='Previous'
          >‹</button>
          <button
            onClick={next}
            className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 text-xl font-bold'
            aria-label='Next'
          >›</button>

          {/* Dot indicators */}
          <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10'>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={'rounded-full transition-all duration-300 ' + (i === current ? 'w-6 h-2 bg-white shadow' : 'w-2 h-2 bg-white/50 hover:bg-white/80')}
                aria-label={'Slide ' + (i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SectionBanner
