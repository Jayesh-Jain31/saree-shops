import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const policyLinks = [
  { label: 'Privacy Policy',   to: '/page/privacy-policy' },
  { label: 'Refund Policy',    to: '/page/refund-policy' },
  { label: 'Terms of Service', to: '/page/terms' },
  { label: 'Shipping Policy',  to: '/page/shipping-policy' },
  { label: 'About Us',         to: '/page/about-us' },
]

const Footer = () => {
  const siteName = useSelector(state => state.site.name)
  const logoUrl = useSelector(state => state.site.logoUrl)
  const allCategory = useSelector(state => state.product.allCategory)
  const [social, setSocial] = useState({ facebook: '', instagram: '', linkedin: '', youtube: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          const s = res.data.data
          setSocial({
            facebook:  s.social_facebook  || '',
            instagram: s.social_instagram || '',
            linkedin:  s.social_linkedin  || '',
            youtube:   s.social_youtube   || '',
          })
        }
      } catch (e) {}
    }
    fetchSettings()
  }, [])

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?q=${encodeURIComponent(categoryName)}`)
  }

  const displayCategories = allCategory?.slice(0, 8) || []

  return (
    <footer className='bg-white border-t mt-8'>
      <div className='container mx-auto px-4 py-8'>
        {/*
          Mobile:  Brand full-width | then 2-col (Categories | Quick Links) | Follow Us full-width
          Desktop: 4 equal columns side by side
        */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>

          {/* Column 1 — Brand (full-width on mobile) */}
          <div className='col-span-2 lg:col-span-1'>
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className='h-10 w-auto object-contain mb-2' />
            ) : (
              <h2 className='font-bold text-lg text-primary-text mb-2'>{siteName}</h2>
            )}
            <p className='text-xs text-gray-500 leading-relaxed'>
              Your trusted destination for beautiful sarees. Quality fabrics, authentic designs, delivered to your door.
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h3 className='font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide'>Quick Links</h3>
            <ul className='space-y-2'>
              {policyLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-gray-500 hover:text-primary transition-colors'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Shop Categories */}
          <div>
            <h3 className='font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide'>Shop Categories</h3>
            <ul className='space-y-2'>
              {displayCategories.length > 0 ? (
                displayCategories.map(cat => (
                  <li key={cat._id}>
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className='text-sm text-gray-500 hover:text-primary transition-colors text-left'
                    >
                      {cat.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className='text-xs text-gray-400'>Loading...</li>
              )}
            </ul>
          </div>

          {/* Column 4 — Social + copyright (full-width on mobile) */}
          <div className='col-span-2 lg:col-span-1'>
            <h3 className='font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide'>Follow Us</h3>
            <div className='flex items-center gap-4 text-2xl mb-4'>
              {social.facebook ? (
                <a href={social.facebook} target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-primary transition-colors'><FaFacebook /></a>
              ) : <FaFacebook className='text-gray-200' />}
              {social.instagram ? (
                <a href={social.instagram} target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-primary transition-colors'><FaInstagram /></a>
              ) : <FaInstagram className='text-gray-200' />}
              {social.linkedin ? (
                <a href={social.linkedin} target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-primary transition-colors'><FaLinkedin /></a>
              ) : <FaLinkedin className='text-gray-200' />}
              {social.youtube ? (
                <a href={social.youtube} target='_blank' rel='noopener noreferrer' className='text-gray-400 hover:text-primary transition-colors'><FaYoutube /></a>
              ) : <FaYoutube className='text-gray-200' />}
            </div>
            <p className='text-xs text-gray-400'>© {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
          </div>

        </div>
      </div>

      {/* Bottom policy strip */}
      <div className='border-t bg-gray-50'>
        <div className='container mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1'>
          {policyLinks.map((link, i) => (
            <React.Fragment key={link.to}>
              <Link to={link.to} className='text-[11px] text-gray-400 hover:text-primary transition-colors'>
                {link.label}
              </Link>
              {i < policyLinks.length - 1 && <span className='text-gray-300 text-[11px]'>·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
