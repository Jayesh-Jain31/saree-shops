import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaWhatsapp } from 'react-icons/fa'
import { MdSettings, MdSave, MdPalette } from 'react-icons/md'
import { HiDocumentText } from 'react-icons/hi'
import { colorPresets, applyTheme } from '../utils/themeColors'

const POLICIES = [
  { key: 'page_privacy',  label: 'Privacy Policy',    slug: 'privacy-policy'  },
  { key: 'page_refund',   label: 'Refund Policy',     slug: 'refund-policy'   },
  { key: 'page_terms',    label: 'Terms of Service',  slug: 'terms'           },
  { key: 'page_shipping', label: 'Shipping Policy',   slug: 'shipping-policy' },
  { key: 'page_about',    label: 'About Us',          slug: 'about-us'        },
]

const SOCIAL_FIELDS = [
  { key: 'social_facebook',  label: 'Facebook URL',  placeholder: 'https://facebook.com/yourpage' },
  { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'social_linkedin',  label: 'LinkedIn URL',  placeholder: 'https://linkedin.com/in/yourpage' },
  { key: 'social_youtube',   label: 'YouTube URL',   placeholder: 'https://youtube.com/c/yourchannel' },
]

const SiteSettings = () => {
  const [whatsapp, setWhatsapp] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [themeColor, setThemeColor] = useState('green')
  const [policyContent, setPolicyContent] = useState({})
  const [activePolicyTab, setActivePolicyTab] = useState(POLICIES[0].key)
  const [social, setSocial] = useState({})
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          const s = res.data.data
          setWhatsapp(s.whatsapp_number || '')
          setEnabled(s.whatsapp_enabled !== 'false')
          if (s.theme_color) setThemeColor(s.theme_color)
          setStoreName(s.store_name || '')

          const policies = {}
          POLICIES.forEach(p => { policies[p.key] = s[p.key] || '' })
          setPolicyContent(policies)

          const socialData = {}
          SOCIAL_FIELDS.forEach(f => { socialData[f.key] = s[f.key] || '' })
          setSocial(socialData)
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const saveSetting = async (key, value) => {
    await Axios({ ...SummaryApi.updateSetting, data: { key, value: String(value) } })
  }

  const handleToggle = async () => {
    const newVal = !enabled
    setEnabled(newVal)
    try {
      await saveSetting('whatsapp_enabled', newVal)
      toast.success(`WhatsApp button ${newVal ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update')
      setEnabled(!newVal)
    }
  }

  const handleSave = async () => {
    if (!whatsapp.trim()) return toast.error('Please enter a WhatsApp number')
    const cleaned = whatsapp.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 15) {
      return toast.error('Enter a valid number with country code (e.g. 919876543210)')
    }
    setSaving(true)
    try {
      await saveSetting('whatsapp_number', cleaned)
      toast.success('WhatsApp number saved!')
      setWhatsapp(cleaned)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeSelect = (key) => {
    setThemeColor(key)
    applyTheme(key)
  }

  const handleSaveTheme = async () => {
    setSavingTheme(true)
    try {
      await saveSetting('theme_color', themeColor)
      toast.success(`Theme saved! (${colorPresets[themeColor]?.label})`)
    } catch {
      toast.error('Failed to save theme')
    } finally {
      setSavingTheme(false)
    }
  }

  const handleSavePolicy = async () => {
    setSavingPolicy(true)
    try {
      const currentPolicy = POLICIES.find(p => p.key === activePolicyTab)
      await saveSetting(activePolicyTab, policyContent[activePolicyTab] || '')
      toast.success(`${currentPolicy?.label} saved!`)
    } catch {
      toast.error('Failed to save policy')
    } finally {
      setSavingPolicy(false)
    }
  }

  const handleSaveSocial = async () => {
    setSavingSocial(true)
    try {
      if (storeName) await saveSetting('store_name', storeName)
      await Promise.all(SOCIAL_FIELDS.map(f => saveSetting(f.key, social[f.key] || '')))
      toast.success('Social links saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingSocial(false)
    }
  }

  const activePolicy = POLICIES.find(p => p.key === activePolicyTab)

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-2xl mx-auto space-y-5'>

        {/* Page Header */}
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center'>
            <MdSettings className='text-primary-text' size={20} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>Site Settings</h1>
            <p className='text-xs text-gray-500'>Manage your store configuration</p>
          </div>
        </div>

        {/* ── Theme Color Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-primary-light'>
              <MdPalette className='text-primary-text' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Website Color Theme</h2>
              <p className='text-xs text-gray-500'>Change the accent color across the entire site</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='grid grid-cols-4 gap-3'>
              {Object.entries(colorPresets).map(([key, preset]) => (
                <button key={key} onClick={() => handleThemeSelect(key)} className='flex flex-col items-center gap-1.5 group'>
                  <span
                    className={`w-10 h-10 rounded-full transition-all duration-150 ${themeColor === key ? 'scale-110' : 'group-hover:scale-105'}`}
                    style={{
                      backgroundColor: preset.primary,
                      boxShadow: themeColor === key ? `0 0 0 3px white, 0 0 0 5px ${preset.primary}` : 'none',
                    }}
                  />
                  <span className='text-[10px] text-gray-500 font-medium'>{preset.label}</span>
                </button>
              ))}
            </div>
            <div className='rounded-xl p-4 text-white text-sm font-semibold flex items-center justify-between' style={{ backgroundColor: colorPresets[themeColor]?.primary }}>
              <span>Preview: {colorPresets[themeColor]?.label} theme</span>
              <span className='opacity-75 text-xs'>Buttons · Links · Badges</span>
            </div>
            <button onClick={handleSaveTheme} disabled={savingTheme} className='w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 font-semibold rounded-xl py-3'>
              {savingTheme ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingTheme ? 'Saving...' : 'Save Color Theme'}
            </button>
          </div>
        </div>

        {/* ── Policy Pages Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-primary-light'>
              <HiDocumentText className='text-primary-text' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Policy Pages</h2>
              <p className='text-xs text-gray-500'>Edit Privacy, Refund, Terms, Shipping & About Us pages</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className='flex overflow-x-auto border-b scrollbar-none'>
            {POLICIES.map(p => (
              <button
                key={p.key}
                onClick={() => setActivePolicyTab(p.key)}
                className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activePolicyTab === p.key
                    ? 'border-primary text-primary-text bg-primary-light'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className='p-5 space-y-3'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-gray-600'>{activePolicy?.label} content</label>
              <a
                href={`/page/${activePolicy?.slug}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-xs text-primary underline'
              >
                Preview page ↗
              </a>
            </div>
            <p className='text-[11px] text-gray-400'>
              You can use plain text or basic HTML (e.g. &lt;b&gt;bold&lt;/b&gt;, &lt;br/&gt; line break). Each new line is shown as a paragraph break.
            </p>
            <textarea
              value={policyContent[activePolicyTab] || ''}
              onChange={e => setPolicyContent(prev => ({ ...prev, [activePolicyTab]: e.target.value }))}
              rows={12}
              placeholder={`Enter your ${activePolicy?.label} content here...\n\nYou can write plain text or use basic HTML tags.\nExample:\n<b>Section Heading</b>\nYour policy text goes here...`}
              className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition font-mono resize-y'
            />
            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className='w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 font-semibold rounded-xl py-3'
            >
              {savingPolicy ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingPolicy ? 'Saving...' : `Save ${activePolicy?.label}`}
            </button>
          </div>
        </div>

        {/* ── Social & Store Info Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='p-5 border-b'>
            <h2 className='font-bold text-gray-800'>Store Info & Social Links</h2>
            <p className='text-xs text-gray-500'>These appear in the footer of your website</p>
          </div>
          <div className='p-5 space-y-3'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Store Name</label>
              <input
                type='text'
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder='Binkeyit'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
              />
            </div>
            {SOCIAL_FIELDS.map(field => (
              <div key={field.key}>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>{field.label}</label>
                <input
                  type='url'
                  value={social[field.key] || ''}
                  onChange={e => setSocial(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
                />
              </div>
            ))}
            <button
              onClick={handleSaveSocial}
              disabled={savingSocial}
              className='w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 font-semibold rounded-xl py-3'
            >
              {savingSocial ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingSocial ? 'Saving...' : 'Save Store Info & Links'}
            </button>
          </div>
        </div>

        {/* ── WhatsApp Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between p-5 border-b'>
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <FaWhatsapp className={enabled ? 'text-green-600' : 'text-gray-400'} size={20} />
              </div>
              <div>
                <h2 className='font-bold text-gray-800'>WhatsApp Button</h2>
                <p className='text-xs text-gray-500'>Floating button on the bottom-right of your site</p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className={`px-5 py-2 text-xs font-semibold ${enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
            {enabled ? '✓ Button is visible to customers' : '✕ Button is hidden from customers'}
          </div>
          <div className='p-5 space-y-4'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>WhatsApp Number (with country code, no + or spaces)</label>
              <input
                type='tel'
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder='919876543210'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition'
              />
              <p className='text-[11px] text-gray-400 mt-1'>Example: 919876543210 → 91 (India) + 10-digit mobile number</p>
            </div>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700 hover:bg-green-100 transition'>
                <FaWhatsapp size={16} />
                <span>Test: wa.me/{whatsapp.replace(/\D/g, '')}</span>
              </a>
            )}
            <button onClick={handleSave} disabled={saving} className='w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 transition-colors'>
              {saving ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {saving ? 'Saving...' : 'Save Number'}
            </button>
          </div>
        </div>

        <p className='text-center text-xs text-gray-400 mt-4'>Changes take effect immediately on the live site</p>
      </div>
    </div>
  )
}

export default SiteSettings
