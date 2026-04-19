import React, { useEffect, useRef, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { MdSave, MdPreview, MdAdd, MdDelete } from 'react-icons/md'
import { HiDocumentText } from 'react-icons/hi'

const POLICIES = [
  { key: 'page_privacy',  label: 'Privacy Policy',    slug: 'privacy-policy'  },
  { key: 'page_refund',   label: 'Refund Policy',     slug: 'refund-policy'   },
  { key: 'page_terms',    label: 'Terms of Service',  slug: 'terms'           },
  { key: 'page_shipping', label: 'Shipping Policy',   slug: 'shipping-policy' },
  { key: 'page_about',    label: 'About Us',          slug: 'about-us'        },
  { key: 'page_return',   label: 'Return Policy',     slug: 'return-policy'   },
  { key: 'page_contact',  label: 'Contact Us',        slug: 'contact-us'      },
]

const PolicyAdmin = () => {
  const [policyContent, setPolicyContent] = useState({})
  const [activePolicyTab, setActivePolicyTab] = useState(POLICIES[0].key)
  const [customPolicies, setCustomPolicies] = useState([])
  const [allPolicies, setAllPolicies] = useState(POLICIES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddPage, setShowAddPage] = useState(false)
  const [newPageLabel, setNewPageLabel] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)
  const textareaRef = useRef(null)

  const saveSetting = async (key, value) => {
    await Axios({ ...SummaryApi.updateSetting, data: { key, value: String(value) } })
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          const s = res.data.data
          const policies = {}
          POLICIES.forEach(p => { policies[p.key] = s[p.key] || '' })
          if (s.custom_policy_pages) {
            try {
              const custom = JSON.parse(s.custom_policy_pages)
              setCustomPolicies(custom)
              setAllPolicies([...POLICIES, ...custom])
              custom.forEach(p => { policies[p.key] = s[p.key] || '' })
            } catch {}
          }
          setPolicyContent(policies)
        }
      } catch {
        toast.error('Failed to load policy pages')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const wrapSelection = (openTag, closeTag) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const current = policyContent[activePolicyTab] || ''
    const selected = current.slice(start, end)
    const newVal = current.slice(0, start) + openTag + selected + closeTag + current.slice(end)
    setPolicyContent(prev => ({ ...prev, [activePolicyTab]: newVal }))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + openTag.length, end + openTag.length)
    }, 0)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const current = allPolicies.find(p => p.key === activePolicyTab)
      await saveSetting(activePolicyTab, policyContent[activePolicyTab] || '')
      toast.success(`${current?.label || 'Page'} saved!`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPage = async () => {
    if (!newPageLabel.trim() || !newPageSlug.trim()) {
      toast.error('Please enter both name and slug')
      return
    }
    const key = `page_custom_${newPageSlug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
    const slug = newPageSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    const newPage = { key, label: newPageLabel.trim(), slug }
    setSavingCustom(true)
    try {
      const updated = [...customPolicies, newPage]
      await saveSetting('custom_policy_pages', JSON.stringify(updated))
      setCustomPolicies(updated)
      setAllPolicies([...POLICIES, ...updated])
      setPolicyContent(prev => ({ ...prev, [key]: '' }))
      setActivePolicyTab(key)
      setNewPageLabel('')
      setNewPageSlug('')
      setShowAddPage(false)
      toast.success('New policy page added!')
    } catch {
      toast.error('Failed to add page')
    } finally {
      setSavingCustom(false)
    }
  }

  const handleDeletePage = async (pageKey) => {
    if (!window.confirm('Delete this policy page?')) return
    const updated = customPolicies.filter(p => p.key !== pageKey)
    try {
      await saveSetting('custom_policy_pages', JSON.stringify(updated))
      await saveSetting(pageKey, '')
      setCustomPolicies(updated)
      setAllPolicies([...POLICIES, ...updated])
      setPolicyContent(prev => { const n = { ...prev }; delete n[pageKey]; return n })
      setActivePolicyTab(POLICIES[0].key)
      toast.success('Page deleted')
    } catch {
      toast.error('Failed to delete page')
    }
  }

  const activePolicy = allPolicies.find(p => p.key === activePolicyTab)
  const isCustom = customPolicies.some(p => p.key === activePolicyTab)

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center'>
            <HiDocumentText className='text-primary' size={20} />
          </div>
          <div>
            <h1 className='text-lg font-bold text-gray-800'>Policy Pages</h1>
            <p className='text-xs text-gray-500'>Edit and manage all your policy pages</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddPage(v => !v)}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition'
        >
          <MdAdd size={16} /> Add Page
        </button>
      </div>

      {showAddPage && (
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3'>
          <p className='text-xs font-bold text-blue-700'>New Policy Page</p>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs text-gray-600 font-semibold block mb-1'>Page Name</label>
              <input
                value={newPageLabel}
                onChange={e => setNewPageLabel(e.target.value)}
                placeholder='e.g. Cookie Policy'
                className='w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
              />
            </div>
            <div>
              <label className='text-xs text-gray-600 font-semibold block mb-1'>URL Slug</label>
              <input
                value={newPageSlug}
                onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder='e.g. cookie-policy'
                className='w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
              />
            </div>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={handleAddPage}
              disabled={savingCustom}
              className='flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50'
            >
              {savingCustom ? 'Adding...' : 'Add Page'}
            </button>
            <button onClick={() => setShowAddPage(false)} className='px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50'>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <div className='flex border-b min-w-max'>
            {allPolicies.map(p => (
              <button
                key={p.key}
                onClick={() => setActivePolicyTab(p.key)}
                className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activePolicyTab === p.key
                    ? 'border-primary text-primary bg-pink-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className='p-5 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='font-bold text-gray-800 text-sm'>{activePolicy?.label}</h2>
              <p className='text-[11px] text-gray-400 mt-0.5'>
                URL: <span className='font-mono text-gray-500'>/page/{activePolicy?.slug}</span>
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isCustom && (
                <button
                  onClick={() => handleDeletePage(activePolicyTab)}
                  className='flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition'
                >
                  <MdDelete size={14} /> Delete
                </button>
              )}
              <a
                href={`/page/${activePolicy?.slug}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 px-3 py-1.5 text-xs text-primary border border-primary/30 rounded-lg hover:bg-pink-50 transition'
              >
                <MdPreview size={14} /> Preview
              </a>
            </div>
          </div>

          <div className='border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition'>
            <div className='flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200'>
              <span className='text-[10px] text-gray-400 mr-1 font-semibold uppercase'>Format:</span>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<b>', '</b>') }}
                className='px-2 py-1 text-xs font-bold rounded hover:bg-gray-200 transition'
                title='Bold'
              >B</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<i>', '</i>') }}
                className='px-2 py-1 text-xs italic rounded hover:bg-gray-200 transition'
                title='Italic'
              >I</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<u>', '</u>') }}
                className='px-2 py-1 text-xs underline rounded hover:bg-gray-200 transition'
                title='Underline'
              >U</button>
              <div className='w-px h-4 bg-gray-300 mx-1' />
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<h2>', '</h2>') }}
                className='px-2 py-1 text-xs font-semibold rounded hover:bg-gray-200 transition'
                title='Heading 2'
              >H2</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<h3>', '</h3>') }}
                className='px-2 py-1 text-xs font-semibold rounded hover:bg-gray-200 transition'
                title='Heading 3'
              >H3</button>
              <div className='w-px h-4 bg-gray-300 mx-1' />
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<ul>\n  <li>', '</li>\n</ul>') }}
                className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition'
                title='Bullet List'
              >• List</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<li>', '</li>') }}
                className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition'
                title='List Item'
              >• Item</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<br/>', '') }}
                className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition'
                title='Line Break'
              >↵ BR</button>
              <button
                type='button'
                onMouseDown={e => { e.preventDefault(); wrapSelection('<hr/>', '') }}
                className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition'
                title='Divider Line'
              >— HR</button>
            </div>
            <textarea
              ref={textareaRef}
              value={policyContent[activePolicyTab] || ''}
              onChange={e => setPolicyContent(prev => ({ ...prev, [activePolicyTab]: e.target.value }))}
              rows={18}
              placeholder={`Write your ${activePolicy?.label} content here...\n\nTip: Select text and click a toolbar button to format it.\n\nExample:\n<b>1. Introduction</b>\nWelcome to our store...\n\n<b>2. Refund Terms</b>\nWe accept returns within 7 days...`}
              className='w-full px-4 py-3 text-sm outline-none font-mono resize-y bg-white'
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className='w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 font-semibold rounded-xl py-3'
          >
            {saving ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
            {saving ? 'Saving...' : `Save ${activePolicy?.label}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PolicyAdmin
