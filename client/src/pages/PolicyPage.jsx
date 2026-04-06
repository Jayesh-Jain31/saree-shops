import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import Loading from '../components/Loading'

const PAGE_META = {
  'privacy-policy':  { key: 'page_privacy',  title: 'Privacy Policy' },
  'refund-policy':   { key: 'page_refund',   title: 'Refund Policy' },
  'terms':           { key: 'page_terms',    title: 'Terms of Service' },
  'shipping-policy': { key: 'page_shipping', title: 'Shipping Policy' },
  'about-us':        { key: 'page_about',    title: 'About Us' },
}

const PolicyPage = () => {
  const { slug } = useParams()
  const meta = PAGE_META[slug]
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!meta) { setLoading(false); return }
    const fetchContent = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          setContent(res.data.data[meta.key] || '')
        }
      } catch (e) {}
      finally { setLoading(false) }
    }
    fetchContent()
  }, [slug])

  if (!meta) {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3'>
        <p className='text-2xl font-bold text-gray-400'>Page not found</p>
        <Link to='/' className='text-primary underline'>Go Home</Link>
      </div>
    )
  }

  return (
    <div className='bg-white min-h-[70vh]'>
      {/* Hero strip */}
      <div className='bg-primary-light py-10 px-4 border-b'>
        <div className='max-w-3xl mx-auto'>
          <h1 className='text-2xl lg:text-3xl font-bold text-primary-text'>{meta.title}</h1>
          <p className='text-xs text-gray-500 mt-1'>Last updated by store admin</p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-3xl mx-auto px-4 py-8'>
        {loading ? (
          <div className='flex justify-center py-16'><Loading /></div>
        ) : content ? (
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
