import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaWhatsapp } from 'react-icons/fa'
import { MdSettings, MdSave } from 'react-icons/md'

const SiteSettings = () => {
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          setWhatsapp(res.data.data.whatsapp_number || '')
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!whatsapp.trim()) return toast.error('Please enter a WhatsApp number')
    const cleaned = whatsapp.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 15) {
      return toast.error('Enter a valid number with country code (e.g. 919876543210)')
    }
    setSaving(true)
    try {
      const res = await Axios({
        ...SummaryApi.updateSetting,
        data: { key: 'whatsapp_number', value: cleaned }
      })
      if (res.data.success) {
        toast.success('WhatsApp number saved!')
        setWhatsapp(cleaned)
      }
    } catch (error) {
      toast.error('Failed to save setting')
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
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
            <MdSettings className='text-green-600' size={20} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>Site Settings</h1>
            <p className='text-xs text-gray-500'>Manage your store configuration</p>
          </div>
        </div>

        {/* WhatsApp Setting */}
        <div className='bg-white rounded-2xl border p-5 shadow-sm'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
              <FaWhatsapp className='text-green-600' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>WhatsApp Number</h2>
              <p className='text-xs text-gray-500'>Customers tap this to chat with you directly</p>
            </div>
          </div>

          <div className='space-y-3'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>
                Number with country code (no + or spaces)
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
              <div className='flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700'>
                <FaWhatsapp size={16} />
                <span>Preview link: wa.me/{whatsapp.replace(/\D/g, '')}</span>
              </div>
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
              {saving ? 'Saving...' : 'Save Settings'}
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
