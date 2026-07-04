import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const SectionBanner = ({ placement = 'section-silk', className = '' }) => {
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
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [slides.length, next])

  if (loading) {
    return (
      <div className={`w-full rounded-xl overflow-hidden ${className}`} style={{ height: '140px' }}>
        <div className='w-full h-full bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 animate-pulse' />
      </div>
    )
  }

  if (slides.length === 0) return null

  const slide = slides[current]

  return (
    <div className={`relative w-full overflow-hidden rounded-xl shadow-sm group ${className}`} style={{ minHeight: '100px' }}>
      <div key={current} style={{ animation: 'sectionFadeIn 0.4s ease' }}>
        {slide.link ? (
          <Link to={slide.link} className='block w-full'>
            <img
              src={slide.image}
              className='w-full object-cover hidden md:block'
              style={{ maxHeight: '220px' }}
              alt={slide.title || 'banner'}
            />
            <img
              src={slide.imageMobile || slide.image}
              className='w-full object-cover md:hidden'
              style={{ maxHeight: '160px' }}
              alt={slide.title || 'banner'}
            />
          </Link>
        ) : (
          <>
            <img
              src={slide.image}
              className='w-full object-cover hidden md:block'
              style={{ maxHeight: '220px' }}
              alt={slide.title || 'banner'}
            />
            <img
              src={slide.imageMobile || slide.image}
              className='w-full object-cover md:hidden'
              style={{ maxHeight: '160px' }}
              alt={slide.title || 'banner'}
            />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white text-gray-600 rounded-full flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100 text-lg font-bold'
            aria-label='Previous'
          >‹</button>
          <button
            onClick={next}
            className='absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white text-gray-600 rounded-full flex items-center justify-center shadow transition-all opacity-0 group-hover:opacity-100 text-lg font-bold'
            aria-label='Next'
          >›</button>
          <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1'>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={'rounded-full transition-all ' + (i === current ? 'w-4 h-1.5 bg-white shadow' : 'w-1.5 h-1.5 bg-white/50')}
                aria-label={'Slide ' + (i + 1)}
              />
            ))}
          </div>
        </>
      )}

      <style>{'@keyframes sectionFadeIn { from { opacity: 0.8; } to { opacity: 1; } }'}</style>
    </div>
  )
}

export default SectionBanner
