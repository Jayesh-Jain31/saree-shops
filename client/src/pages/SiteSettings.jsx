import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaWhatsapp } from 'react-icons/fa'
import { MdSettings, MdSave } from 'react-icons/md'

const SiteSettings = () => {
  const [whatsapp, setWhatsapp] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          setWhatsapp(res.data.data.whatsapp_number || '')
          setEnabled(res.data.data.whatsapp_enabled !== 'false')
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

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-xl mx-auto'>

        {/* Header */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
            <MdSettings className='text-green-600' size={20} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>Site Settings</h1>
            <p className='text-xs text-gray-500'>Manage your store configuration</p>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>

          {/* Card Header with Toggle */}
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

            {/* Toggle Switch */}
            <button
              onClick={handleToggle}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              aria-label='Toggle WhatsApp button'
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Status Banner */}
          <div className={`px-5 py-2 text-xs font-semibold ${enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
            {enabled ? '✓ Button is visible to customers' : '✕ Button is hidden from customers'}
          </div>

          {/* Number Input */}
          <div className='p-5 space-y-4'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>
                WhatsApp Number (with country code, no + or spaces)
              </label>
              <input
                type='tel'
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder='919876543210'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition'
              />
              <p className='text-[11px] text-gray-400 mt-1'>
                Example: 919876543210 → 91 (India) + 10-digit mobile number
              </p>
            </div>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700 hover:bg-green-100 transition'
              >
                <FaWhatsapp size={16} />
                <span>Test: wa.me/{whatsapp.replace(/\D/g, '')}</span>
              </a>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className='w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 transition-colors'
            >
              {saving ? (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <MdSave size={18} />
              )}
              {saving ? 'Saving...' : 'Save Number'}
            </button>
          </div>
        </div>

        <p className='text-center text-xs text-gray-400 mt-4'>
          Changes take effect immediately on the live site
        </p>
      </div>
    </div>
  )
}

export default SiteSettings
