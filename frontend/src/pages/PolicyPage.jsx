import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import Loading from '../components/Loading'

const STATIC_PAGE_META = {
  'privacy-policy':  { key: 'page_privacy',  title: 'Privacy Policy' },
  'refund-policy':   { key: 'page_refund',   title: 'Refund Policy' },
  'terms':           { key: 'page_terms',    title: 'Terms of Service' },
  'shipping-policy': { key: 'page_shipping', title: 'Shipping Policy' },
  'about-us':        { key: 'page_about',    title: 'About Us' },
  'return-policy':   { key: 'page_return',   title: 'Return Policy' },
  'contact-us':      { key: 'page_contact',  title: 'Contact Us' },
}

const PolicyPage = () => {
  const { slug } = useParams()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setNotFound(false)

    const fetchContent = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (!res.data.success) { setNotFound(true); setLoading(false); return }

        const s = res.data.data

        const staticMeta = STATIC_PAGE_META[slug]
        if (staticMeta) {
          setTitle(s[`${staticMeta.key}_label`] || staticMeta.title)
          setContent(s[staticMeta.key] || '')
          setLoading(false)
          return
        }

        if (s.custom_policy_pages) {
          try {
            const customPages = JSON.parse(s.custom_policy_pages)
            const match = customPages.find(p => p.slug === slug)
            if (match) {
              setTitle(s[`${match.key}_label`] || match.label)
              setContent(s[match.key] || '')
              setLoading(false)
              return
            }
          } catch {}
        }

        setNotFound(true)
      } catch {}
      finally { setLoading(false) }
    }

    fetchContent()
  }, [slug])

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <Loading />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3'>
        <p className='text-2xl font-bold text-gray-400'>Page not found</p>
        <Link to='/' className='text-primary underline'>Go Home</Link>
      </div>
    )
  }

  return (
    <div className='bg-white min-h-[70vh]'>
      <div className='bg-primary-light py-10 px-4 border-b'>
        <div className='max-w-3xl mx-auto'>
          <h1 className='text-2xl lg:text-3xl font-bold text-primary-text'>{title}</h1>
          <p className='text-xs text-gray-500 mt-1'>Last updated by store admin</p>
        </div>
      </div>

      <div className='max-w-3xl mx-auto px-4 py-8'>
        {content ? (
          <div
            className='prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap'
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
          />
        ) : (
          <div className='text-center py-16 text-gray-400'>
            <p className='text-lg font-semibold'>Content coming soon</p>
            <p className='text-sm mt-1'>The store admin will update this page shortly.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PolicyPage
