import React, { useEffect, useRef, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaWhatsapp, FaUndoAlt, FaTools, FaBan, FaBullhorn, FaBolt, FaStore, FaPlus, FaTrash, FaExclamationTriangle } from 'react-icons/fa'
import { MdSettings, MdSave, MdPalette, MdBrandingWatermark } from 'react-icons/md'
import { HiDocumentText } from 'react-icons/hi'
import { colorPresets, applyTheme } from '../utils/themeColors'
import uploadImage from '../utils/UploadImage'
import { useDispatch } from 'react-redux'
import { setLogoUrl as setLogoUrlAction, setSiteName as setSiteNameAction } from '../store/siteSlice'

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
  const dispatch = useDispatch()
  const [whatsapp, setWhatsapp] = useState('')
  const [adminWhatsapp, setAdminWhatsapp] = useState('')
  const [savingAdminWa, setSavingAdminWa] = useState(false)
  const [waAccessToken, setWaAccessToken] = useState('')
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('')
  const [savingWaApi, setSavingWaApi] = useState(false)
  const [testingWaConn, setTestingWaConn] = useState(false)
  const [waConnStatus, setWaConnStatus] = useState(null)
  const [testWaPhone, setTestWaPhone] = useState('')
  const [sendingTestWa, setSendingTestWa] = useState(false)
  const [showWaToken, setShowWaToken] = useState(false)
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [savingLowStock, setSavingLowStock] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [blastMessage, setBlastMessage] = useState('')
  const [blastLoading, setBlastLoading] = useState(false)
  const [blastResult, setBlastResult] = useState(null)
  const [enabled, setEnabled] = useState(true)
  const [themeColor, setThemeColor] = useState('green')
  const [policyContent, setPolicyContent] = useState({})
  const [activePolicyTab, setActivePolicyTab] = useState(POLICIES[0].key)
  const [social, setSocial] = useState({})
  const [storeName, setStoreName] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [returnPeriodDays, setReturnPeriodDays] = useState(7)
  const [savingReturn, setSavingReturn] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [codEnabled, setCodEnabled] = useState(true)
  const [savingCod, setSavingCod] = useState(false)
  const [loyaltyEarnPer100, setLoyaltyEarnPer100] = useState('10')
  const [loyaltyPointValue, setLoyaltyPointValue] = useState('0.25')
  const [loyaltyMinRedeem, setLoyaltyMinRedeem] = useState('50')
  const [loyaltyMaxRedeemPct, setLoyaltyMaxRedeemPct] = useState('50')
  const [loyaltyReturnPeriodDays, setLoyaltyReturnPeriodDays] = useState('7')
  const [savingLoyalty, setSavingLoyalty] = useState(false)
  const [cartHoursThreshold, setCartHoursThreshold] = useState('2')
  const [cartRecoveryMessage, setCartRecoveryMessage] = useState('')
  const [cartRecoveryLoading, setCartRecoveryLoading] = useState(false)
  const [cartRecoveryResult, setCartRecoveryResult] = useState(null)
  const [cartAbandoned, setCartAbandoned] = useState(null)
  const [announcementText, setAnnouncementText] = useState('Free delivery above ₹999')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [outsideDeliveryTime, setOutsideDeliveryTime] = useState('3-4 days')
  const [savingOutsideDelivery, setSavingOutsideDelivery] = useState(false)
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(false)
  const [flashSaleTitle, setFlashSaleTitle] = useState('Flash Sale - Limited Time Offer!')
  const [flashSaleDiscount, setFlashSaleDiscount] = useState('')
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('')
  const [savingFlashSale, setSavingFlashSale] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)
  const [customPolicies, setCustomPolicies] = useState([])
  const [showAddPage, setShowAddPage] = useState(false)
  const [newPageLabel, setNewPageLabel] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [savingCustomPages, setSavingCustomPages] = useState(false)
  const policyTextareaRef = useRef(null)

  const wrapSelection = (openTag, closeTag) => {
    const el = policyTextareaRef.current
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Axios({ ...SummaryApi.getSettings })
        if (res.data.success) {
          const s = res.data.data
          setWhatsapp(s.whatsapp_number || '')
          setAdminWhatsapp(s.admin_whatsapp_number || '')
          if (s.whatsapp_access_token) setWaAccessToken(s.whatsapp_access_token)
          if (s.whatsapp_phone_number_id) setWaPhoneNumberId(s.whatsapp_phone_number_id)
          setLowStockThreshold(s.low_stock_threshold || '5')
          setEnabled(s.whatsapp_enabled !== 'false')
          if (s.theme_color) setThemeColor(s.theme_color)
          setStoreName(s.store_name || '')
          setLogoPreview(s.store_logo || '')
          if (s.return_period_days) setReturnPeriodDays(parseInt(s.return_period_days) || 7)
          setMaintenanceMode(s.maintenance_mode === 'true')
          setMaintenanceMessage(s.maintenance_message || '')
          setCodEnabled(s.cod_enabled !== 'false')
          if (s.loyalty_earn_per_100) setLoyaltyEarnPer100(s.loyalty_earn_per_100)
          if (s.loyalty_point_value) setLoyaltyPointValue(s.loyalty_point_value)
          if (s.loyalty_min_redeem) setLoyaltyMinRedeem(s.loyalty_min_redeem)
          if (s.loyalty_max_redeem_pct) setLoyaltyMaxRedeemPct(s.loyalty_max_redeem_pct)
          if (s.loyalty_return_period_days) setLoyaltyReturnPeriodDays(s.loyalty_return_period_days)
          setAnnouncementText(s.announcement_text || 'Free delivery above ₹999')
          setAnnouncementEnabled(s.announcement_enabled === 'true')
          setOutsideDeliveryTime(s.outside_delivery_time || '3-4 days')
          setFlashSaleEnabled(s.flash_sale_enabled === 'true')
          setFlashSaleTitle(s.flash_sale_title || 'Flash Sale - Limited Time Offer!')
          setFlashSaleDiscount(s.flash_sale_discount || '')
          setFlashSaleEndTime(s.flash_sale_end_time || '')

          const policies = {}
          POLICIES.forEach(p => { policies[p.key] = s[p.key] || '' })
          if (s.custom_policy_pages) {
            try {
              const custom = JSON.parse(s.custom_policy_pages)
              setCustomPolicies(custom)
              custom.forEach(p => { policies[p.key] = s[p.key] || '' })
            } catch {}
          }
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
    Axios({ ...SummaryApi.getActiveCoupons }).then(res => {
      if (res.data.success) setActiveCoupons(res.data.data || [])
    }).catch(() => {})
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

  const allPolicies = [...POLICIES, ...customPolicies]

  const handleSavePolicy = async () => {
    setSavingPolicy(true)
    try {
      const currentPolicy = allPolicies.find(p => p.key === activePolicyTab)
      await saveSetting(activePolicyTab, policyContent[activePolicyTab] || '')
      toast.success(`${currentPolicy?.label} saved!`)
    } catch {
      toast.error('Failed to save policy')
    } finally {
      setSavingPolicy(false)
    }
  }

  const handleAddPage = async () => {
    if (!newPageLabel.trim() || !newPageSlug.trim()) return toast.error('Enter both a page name and URL slug')
    const slug = newPageSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const key = `page_${slug.replace(/-/g, '_')}`
    if (allPolicies.find(p => p.key === key || p.slug === slug)) return toast.error('A page with this slug already exists')
    const newPage = { key, label: newPageLabel.trim(), slug, custom: true }
    const updated = [...customPolicies, newPage]
    setSavingCustomPages(true)
    try {
      await saveSetting('custom_policy_pages', JSON.stringify(updated))
      setCustomPolicies(updated)
      setPolicyContent(prev => ({ ...prev, [key]: '' }))
      setActivePolicyTab(key)
      setNewPageLabel('')
      setNewPageSlug('')
      setShowAddPage(false)
      toast.success(`"${newPage.label}" page created!`)
    } catch { toast.error('Failed to create page') }
    finally { setSavingCustomPages(false) }
  }

  const handleDeletePage = async (pageKey) => {
    if (!window.confirm('Delete this page? This cannot be undone.')) return
    const updated = customPolicies.filter(p => p.key !== pageKey)
    setSavingCustomPages(true)
    try {
      await saveSetting('custom_policy_pages', JSON.stringify(updated))
      await saveSetting(pageKey, '')
      setCustomPolicies(updated)
      setPolicyContent(prev => { const n = { ...prev }; delete n[pageKey]; return n })
      setActivePolicyTab(POLICIES[0].key)
      toast.success('Page deleted!')
    } catch { toast.error('Failed to delete page') }
    finally { setSavingCustomPages(false) }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    setUploadingLogo(true)
    try {
      const res = await uploadImage(file)
      const url = res?.data?.data?.url
      if (!url) throw new Error('No URL returned')
      await saveSetting('store_logo', url)
      setLogoPreview(url)
      dispatch(setLogoUrlAction(url))
      toast.success('Logo updated! Reload the page to see it in the header.')
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    await saveSetting('store_logo', '')
    setLogoPreview('')
    dispatch(setLogoUrlAction(''))
    toast.success('Logo removed — site name will be shown instead')
  }

  const [savingBrand, setSavingBrand] = useState(false)

  const handleSaveBrand = async () => {
    setSavingBrand(true)
    try {
      await saveSetting('store_name', storeName)
      if (storeName) dispatch(setSiteNameAction(storeName))
      toast.success('Brand identity saved!')
    } catch {
      toast.error('Failed to save brand settings')
    } finally {
      setSavingBrand(false)
    }
  }

  const handleSaveSocial = async () => {
    setSavingSocial(true)
    try {
      await Promise.all(SOCIAL_FIELDS.map(f => saveSetting(f.key, social[f.key] || '')))
      toast.success('Social links saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingSocial(false)
    }
  }

  const handleSaveReturnPeriod = async () => {
    const days = parseInt(returnPeriodDays)
    if (!days || days < 1 || days > 365) return toast.error('Please enter a valid number of days (1–365)')
    setSavingReturn(true)
    try {
      await saveSetting('return_period_days', String(days))
      toast.success(`Return period set to ${days} day${days !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Failed to save return period')
    } finally {
      setSavingReturn(false)
    }
  }

  const handleSaveMaintenance = async () => {
    setSavingMaintenance(true)
    try {
      await saveSetting('maintenance_mode', String(maintenanceMode))
      await saveSetting('maintenance_message', maintenanceMessage || 'We are currently under maintenance. Please check back soon.')
      toast.success(maintenanceMode ? 'Maintenance mode enabled — site is hidden from customers' : 'Maintenance mode disabled — site is live')
    } catch {
      toast.error('Failed to update maintenance settings')
    } finally {
      setSavingMaintenance(false)
    }
  }

  const handleToggleMaintenance = () => setMaintenanceMode(prev => !prev)

  const handleSaveOutsideDelivery = async () => {
    setSavingOutsideDelivery(true)
    try {
      await saveSetting('outside_delivery_time', outsideDeliveryTime || '3-4 days')
      toast.success('Outside delivery time saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingOutsideDelivery(false)
    }
  }

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true)
    try {
      await saveSetting('announcement_text', announcementText || 'Free delivery above ₹999')
      await saveSetting('announcement_enabled', String(announcementEnabled))
      toast.success(announcementEnabled ? 'Announcement bar is now live!' : 'Announcement bar saved (currently hidden)')
    } catch {
      toast.error('Failed to save announcement settings')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleSaveFlashSale = async () => {
    if (flashSaleEnabled && !flashSaleEndTime) return toast.error('Please set an end date/time for the flash sale')
    setSavingFlashSale(true)
    try {
      await saveSetting('flash_sale_enabled', String(flashSaleEnabled))
      await saveSetting('flash_sale_title', flashSaleTitle || 'Flash Sale - Limited Time Offer!')
      await saveSetting('flash_sale_discount', flashSaleDiscount || '')
      await saveSetting('flash_sale_end_time', flashSaleEndTime || '')
      toast.success(flashSaleEnabled ? '🔥 Flash Sale is now LIVE!' : 'Flash Sale settings saved (currently off)')
    } catch {
      toast.error('Failed to save flash sale settings')
    } finally {
      setSavingFlashSale(false)
    }
  }

  const handleToggleCod = async () => {
    const newVal = !codEnabled
    setCodEnabled(newVal)
    setSavingCod(true)
    try {
      await saveSetting('cod_enabled', String(newVal))
      toast.success(`Cash on Delivery ${newVal ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update')
      setCodEnabled(!newVal)
    } finally {
      setSavingCod(false)
    }
  }

  const handleSaveLoyalty = async () => {
    setSavingLoyalty(true)
    try {
      await Promise.all([
        saveSetting('loyalty_earn_per_100', String(parseFloat(loyaltyEarnPer100) || 10)),
        saveSetting('loyalty_point_value', String(parseFloat(loyaltyPointValue) || 0.25)),
        saveSetting('loyalty_min_redeem', String(parseInt(loyaltyMinRedeem) || 50)),
        saveSetting('loyalty_max_redeem_pct', String(parseInt(loyaltyMaxRedeemPct) || 50)),
        saveSetting('loyalty_return_period_days', String(parseInt(loyaltyReturnPeriodDays) || 7)),
      ])
      toast.success('Loyalty settings saved!')
    } catch { toast.error('Failed to save loyalty settings') }
    finally { setSavingLoyalty(false) }
  }

  const fetchAbandonedCartStats = async (hours) => {
    try {
      const res = await Axios({ ...SummaryApi.abandonedCartStats, params: { hoursThreshold: hours || cartHoursThreshold } })
      if (res.data.success) setCartAbandoned(res.data.data)
    } catch {}
  }

  const handleCartRecovery = async () => {
    setCartRecoveryLoading(true)
    setCartRecoveryResult(null)
    try {
      const res = await Axios({ ...SummaryApi.abandonedCartRecovery, data: { hoursThreshold: parseInt(cartHoursThreshold) || 2, customMessage: cartRecoveryMessage.trim() } })
      if (res.data.success) { setCartRecoveryResult(res.data.data); toast.success(res.data.message) }
    } catch (e) { toast.error(e?.response?.data?.message || 'Recovery run failed') }
    finally { setCartRecoveryLoading(false) }
  }

  const activePolicy = allPolicies.find(p => p.key === activePolicyTab)

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

        {/* ── Brand Identity Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b bg-gradient-to-r from-gray-50 to-white'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-primary-light'>
              <MdBrandingWatermark className='text-primary-text' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Brand Identity</h2>
              <p className='text-xs text-gray-500'>Your store logo and name shown in the header</p>
            </div>
          </div>
          <div className='p-5 space-y-5'>

            {/* Live Preview */}
            <div className='rounded-xl border border-gray-200 bg-gray-50 overflow-hidden'>
              <p className='text-[10px] text-gray-400 font-semibold px-3 pt-2 pb-1 uppercase tracking-widest'>Header Preview</p>
              <div className='bg-white border-t px-4 py-3 flex items-center gap-3'>
                {logoPreview ? (
                  <img src={logoPreview} alt='preview' className='h-9 object-contain max-w-[140px]' />
                ) : storeName ? (
                  <span className='font-black text-xl tracking-tight' style={{ color: 'var(--primary, #16a34a)' }}>{storeName}</span>
                ) : (
                  <span className='text-gray-300 font-semibold text-sm italic'>Your store name / logo</span>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-2'>
                Logo Image
                <span className='ml-2 font-normal text-gray-400 text-[10px]'>PNG, JPG, SVG — transparent BG works best</span>
              </label>
              <div className='flex items-center gap-4'>
                <div className='w-24 h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden'>
                  {uploadingLogo ? (
                    <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt='Logo' className='w-full h-full object-contain p-1' />
                  ) : (
                    <FaStore className='text-gray-300' size={22} />
                  )}
                </div>
                <div className='flex flex-col gap-1.5 flex-1'>
                  <label className='cursor-pointer inline-block'>
                    <span className='inline-flex items-center gap-1.5 btn-primary text-xs font-semibold px-4 py-2 rounded-lg'>
                      {uploadingLogo ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </span>
                    <input type='file' accept='image/*' onChange={handleLogoUpload} disabled={uploadingLogo} className='hidden' />
                  </label>
                  {logoPreview && (
                    <button onClick={handleRemoveLogo} className='text-xs text-red-500 hover:text-red-600 text-left'>
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className='relative flex items-center gap-3'>
              <div className='flex-1 h-px bg-gray-200' />
              <span className='text-[11px] text-gray-400 font-medium whitespace-nowrap'>AND / OR</span>
              <div className='flex-1 h-px bg-gray-200' />
            </div>

            {/* Store Name */}
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>
                Store Name (text)
                <span className='ml-2 font-normal text-gray-400 text-[10px]'>Shown when no logo, or alongside logo</span>
              </label>
              <input
                type='text'
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder='e.g. My Saree Store'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
              />
              <p className='text-[11px] text-gray-400 mt-1'>This also updates the browser tab title, footer, and emails</p>
            </div>

            <button
              onClick={handleSaveBrand}
              disabled={savingBrand}
              className='w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-50 font-semibold rounded-xl py-3'
            >
              {savingBrand ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingBrand ? 'Saving...' : 'Save Brand Identity'}
            </button>
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
          <div className='flex items-center justify-between gap-3 p-5 border-b'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-primary-light'>
                <HiDocumentText className='text-primary-text' size={20} />
              </div>
              <div>
                <h2 className='font-bold text-gray-800'>Policy Pages</h2>
                <p className='text-xs text-gray-500'>Edit and manage all your policy pages</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddPage(v => !v)}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition'
            >
              <FaPlus size={10} /> Add Page
            </button>
          </div>

          {/* Add new page form */}
          {showAddPage && (
            <div className='border-b bg-blue-50 p-4 space-y-3'>
              <p className='text-xs font-bold text-blue-700'>New Policy Page</p>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='text-[11px] text-gray-500 font-medium'>Page Name</label>
                  <input
                    value={newPageLabel}
                    onChange={e => setNewPageLabel(e.target.value)}
                    placeholder='e.g. FAQ'
                    className='w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white'
                  />
                </div>
                <div>
                  <label className='text-[11px] text-gray-500 font-medium'>URL Slug</label>
                  <input
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder='e.g. faq'
                    className='w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white font-mono'
                  />
                  {newPageSlug && <p className='text-[10px] text-gray-400 mt-0.5'>/page/{newPageSlug}</p>}
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={handleAddPage}
                  disabled={savingCustomPages}
                  className='flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50'
                >
                  {savingCustomPages ? 'Creating...' : 'Create Page'}
                </button>
                <button
                  onClick={() => { setShowAddPage(false); setNewPageLabel(''); setNewPageSlug('') }}
                  className='px-4 py-2 border rounded-xl text-sm text-gray-500 hover:bg-gray-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tab bar - horizontally scrollable on mobile */}
          <div className='flex overflow-x-auto border-b scrollbar-none'>
            {allPolicies.map(p => (
              <div key={p.key} className='relative flex-shrink-0'>
                <button
                  onClick={() => setActivePolicyTab(p.key)}
                  className={`flex-shrink-0 px-3 py-2.5 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activePolicyTab === p.key
                      ? 'border-primary text-primary-text bg-primary-light'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } ${p.custom ? 'pr-7' : ''}`}
                >
                  {p.label}
                </button>
                {p.custom && (
                  <button
                    onClick={() => handleDeletePage(p.key)}
                    disabled={savingCustomPages}
                    title='Delete page'
                    className='absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition'
                  >
                    <FaTrash size={8} />
                  </button>
                )}
              </div>
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
            <div className='border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition'>
              <div className='flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200'>
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<b>', '</b>') }} className='px-2 py-1 text-xs font-bold rounded hover:bg-gray-200 transition' title='Bold'>B</button>
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<i>', '</i>') }} className='px-2 py-1 text-xs italic rounded hover:bg-gray-200 transition' title='Italic'>I</button>
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<u>', '</u>') }} className='px-2 py-1 text-xs underline rounded hover:bg-gray-200 transition' title='Underline'>U</button>
                <div className='w-px h-4 bg-gray-300 mx-1' />
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<h2>', '</h2>') }} className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition font-semibold' title='Heading 2'>H2</button>
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<h3>', '</h3>') }} className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition font-semibold' title='Heading 3'>H3</button>
                <div className='w-px h-4 bg-gray-300 mx-1' />
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<ul>\n  <li>', '</li>\n</ul>') }} className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition' title='Bullet List'>• List</button>
                <button type='button' onMouseDown={e => { e.preventDefault(); wrapSelection('<br/>', '') }} className='px-2 py-1 text-xs rounded hover:bg-gray-200 transition' title='Line Break'>↵ BR</button>
              </div>
              <textarea
                ref={policyTextareaRef}
                value={policyContent[activePolicyTab] || ''}
                onChange={e => setPolicyContent(prev => ({ ...prev, [activePolicyTab]: e.target.value }))}
                rows={12}
                placeholder={`Enter your ${activePolicy?.label} content here...\n\nSelect text then click a toolbar button to format it.\nExample:\n<b>Section Heading</b>\nYour policy text goes here...`}
                className='w-full px-4 py-3 text-sm outline-none font-mono resize-y'
              />
            </div>
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
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50'>
              <FaWhatsapp className='text-blue-400' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Social Links</h2>
              <p className='text-xs text-gray-500'>Appear in the footer of your website</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>


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

        {/* ── WhatsApp API Credentials Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-green-100'>
              <FaWhatsapp className='text-green-600' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>WhatsApp API Credentials</h2>
              <p className='text-xs text-gray-500'>Meta Business API — required for automatic customer notifications</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1'>
              <p className='font-semibold'>How to get these:</p>
              <p>1. Go to <span className='font-mono'>developers.facebook.com</span> → Your App → WhatsApp → API Setup</p>
              <p>2. Copy the <strong>Phone Number ID</strong> and <strong>Access Token</strong> from that page</p>
              <p>3. Paste them below and click Save & Test Connection</p>
            </div>

            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Phone Number ID</label>
              <input
                type='text'
                value={waPhoneNumberId}
                onChange={e => setWaPhoneNumberId(e.target.value.trim())}
                placeholder='e.g. 123456789012345'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 transition'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Access Token</label>
              <div className='relative'>
                <input
                  type={showWaToken ? 'text' : 'password'}
                  value={waAccessToken}
                  onChange={e => setWaAccessToken(e.target.value.trim())}
                  placeholder='EAAxxxxxxxxxxxxxxxx...'
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 pr-20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 transition'
                />
                <button
                  type='button'
                  onClick={() => setShowWaToken(v => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600'
                >
                  {showWaToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className='text-[11px] text-gray-400 mt-1'>For test mode: use the temporary token from Meta developers page. For live: generate a permanent token.</p>
            </div>

            <div className='flex gap-2'>
              <button
                onClick={async () => {
                  if (!waPhoneNumberId.trim() || !waAccessToken.trim()) return toast.error('Enter both Phone Number ID and Access Token')
                  setSavingWaApi(true)
                  try {
                    await saveSetting('whatsapp_phone_number_id', waPhoneNumberId.trim())
                    await saveSetting('whatsapp_access_token', waAccessToken.trim())
                    toast.success('WhatsApp API credentials saved!')
                  } catch { toast.error('Failed to save') }
                  finally { setSavingWaApi(false) }
                }}
                disabled={savingWaApi}
                className='flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 transition-colors text-sm'
              >
                {savingWaApi ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={16} />}
                {savingWaApi ? 'Saving...' : 'Save Credentials'}
              </button>

              <button
                onClick={async () => {
                  setTestingWaConn(true)
                  setWaConnStatus(null)
                  try {
                    const res = await Axios({ ...SummaryApi.whatsappTestConnection })
                    setWaConnStatus({ ok: true, msg: res.data.message })
                    toast.success('Connection successful!')
                  } catch (e) {
                    const msg = e.response?.data?.message || 'Connection failed'
                    setWaConnStatus({ ok: false, msg })
                    toast.error(msg)
                  } finally { setTestingWaConn(false) }
                }}
                disabled={testingWaConn}
                className='flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl py-3 transition-colors text-sm'
              >
                {testingWaConn ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <FaWhatsapp size={16} />}
                {testingWaConn ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {waConnStatus && (
              <div className={`rounded-xl p-3 text-xs font-medium ${waConnStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {waConnStatus.ok ? '✅ ' : '❌ '}{waConnStatus.msg}
              </div>
            )}

            {waPhoneNumberId && waAccessToken && (
              <div className='border-t pt-4 space-y-3'>
                <p className='text-xs font-semibold text-gray-600'>Send a Test Message</p>
                <div className='flex gap-2'>
                  <input
                    type='tel'
                    value={testWaPhone}
                    onChange={e => setTestWaPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder='919876543210'
                    className='flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition'
                  />
                  <button
                    onClick={async () => {
                      if (!testWaPhone.trim()) return toast.error('Enter a phone number')
                      setSendingTestWa(true)
                      try {
                        const res = await Axios({ ...SummaryApi.whatsappTestSend, data: { mobile: testWaPhone, template: 'order_confirmation' } })
                        toast.success(res.data.message)
                      } catch (e) { toast.error(e.response?.data?.message || 'Send failed') }
                      finally { setSendingTestWa(false) }
                    }}
                    disabled={sendingTestWa}
                    className='px-4 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold rounded-xl py-2 transition-colors text-sm whitespace-nowrap'
                  >
                    {sendingTestWa ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <FaWhatsapp size={14} />}
                    Send Test
                  </button>
                </div>
                <p className='text-[11px] text-gray-400'>Sends an order_confirmation template message to the number above</p>
              </div>
            )}
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

        {/* ── Admin Order Notifications Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-green-100'>
              <FaWhatsapp className='text-green-600' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Admin Order Alerts</h2>
              <p className='text-xs text-gray-500'>Get WhatsApp notifications on your number for new orders & returns</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 space-y-1'>
              <p className='font-semibold'>📲 How it works:</p>
              <p>When a customer places an order or submits a return, you'll instantly get a WhatsApp message on the number you enter below.</p>
              <p className='text-green-600 font-medium'>⚠️ For this to work, first send any message from your number to your business WhatsApp number to open a 24-hour session.</p>
            </div>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Your WhatsApp Number (receives alerts)</label>
              <input
                type='tel'
                value={adminWhatsapp}
                onChange={e => setAdminWhatsapp(e.target.value.replace(/\D/g, ''))}
                placeholder='919876543210'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition'
              />
              <p className='text-[11px] text-gray-400 mt-1'>Enter with country code, no + or spaces. E.g. 919876543210</p>
            </div>
            <button
              onClick={async () => {
                if (!adminWhatsapp.trim()) return toast.error('Please enter your WhatsApp number')
                setSavingAdminWa(true)
                try {
                  await saveSetting('admin_whatsapp_number', adminWhatsapp.trim())
                  toast.success('Admin alert number saved!')
                } catch { toast.error('Failed to save') }
                finally { setSavingAdminWa(false) }
              }}
              disabled={savingAdminWa}
              className='w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 transition-colors'
            >
              {savingAdminWa ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingAdminWa ? 'Saving...' : 'Save Alert Number'}
            </button>
          </div>
        </div>

        {/* ── WhatsApp Broadcast Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100'>
              <FaWhatsapp className='text-emerald-600' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>WhatsApp Broadcast</h2>
              <p className='text-xs text-gray-500'>Send a message to all active customers who have a mobile number</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700'>
              ⚠️ This sends a free-text message so customers must have messaged your business number first (within 24h) to receive it. Use for promotions, offers, and updates.
            </div>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Broadcast Message</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder='Type your message here... e.g. 🎉 Sale! Get 30% off all sarees this weekend only. Shop now at...'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none'
                maxLength={1000}
              />
              <p className='text-[11px] text-gray-400 mt-1'>{broadcastMessage.length}/1000 characters</p>
            </div>
            <button
              onClick={async () => {
                if (!broadcastMessage.trim()) return toast.error('Please enter a message')
                if (!window.confirm(`Send this message to all active customers?`)) return
                setBroadcastLoading(true)
                try {
                  const res = await Axios({ ...SummaryApi.whatsappBroadcast, data: { message: broadcastMessage } })
                  if (res.data.success) {
                    toast.success(res.data.message)
                    setBroadcastMessage('')
                  }
                } catch { toast.error('Broadcast failed') }
                finally { setBroadcastLoading(false) }
              }}
              disabled={broadcastLoading || !broadcastMessage.trim()}
              className='w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold rounded-xl py-3 transition-colors'
            >
              {broadcastLoading ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Sending...</> : <><FaWhatsapp size={16} /> Send Broadcast</>}
            </button>
          </div>
        </div>

        {/* ── Coupon Offer Blast Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-pink-100'>
              <FaWhatsapp className='text-pink-600' size={20} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Coupon Offer Blast</h2>
              <p className='text-xs text-gray-500'>Send an offer with a coupon code to all your customers via WhatsApp</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='bg-pink-50 border border-pink-200 rounded-xl p-3 text-xs text-pink-700 space-y-1'>
              <p className='font-semibold'>💡 How it works:</p>
              <p>Pick a coupon → edit the message → blast to all customers. Use <span className='font-mono bg-pink-100 px-1 rounded'>{'{{name}}'}</span> for customer name and <span className='font-mono bg-pink-100 px-1 rounded'>{'{{code}}'}</span> for coupon code.</p>
            </div>

            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Select Coupon</label>
              <select
                value={selectedCoupon?.code || ''}
                onChange={e => {
                  const c = activeCoupons.find(cp => cp.code === e.target.value)
                  setSelectedCoupon(c || null)
                  setBlastResult(null)
                  if (c) {
                    const discount = c.discountType === 'percentage'
                      ? `${c.discountValue}% off`
                      : c.discountType === 'flat'
                        ? `₹${c.discountValue} off`
                        : c.discountType === 'free_shipping'
                          ? 'free shipping'
                          : `${c.discountValue}% off`
                    const minOrder = c.minOrderAmount > 0 ? ` on orders above ₹${c.minOrderAmount}` : ''
                    const expiry = c.expiresAt ? ` Valid till ${new Date(c.expiresAt).toLocaleDateString('en-IN')}.` : ''
                    setBlastMessage(`🎉 Hi {{name}}! Special offer just for you!\n\nUse code *{{code}}* to get *${discount}*${minOrder} on your next order.${expiry}\n\nShop now and enjoy the savings! 🛍️`)
                  } else {
                    setBlastMessage('')
                  }
                }}
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition bg-white'
              >
                <option value=''>-- Select a coupon --</option>
                {activeCoupons.map(c => (
                  <option key={c._id} value={c.code}>
                    {c.code} — {c.discountType === 'percentage' ? `${c.discountValue}%` : c.discountType === 'flat' ? `₹${c.discountValue}` : c.discountType} off
                    {c.minOrderAmount > 0 ? ` (min ₹${c.minOrderAmount})` : ''}
                  </option>
                ))}
              </select>
              {activeCoupons.length === 0 && (
                <p className='text-xs text-gray-400 mt-1'>No active coupons found. Create one in Coupons section first.</p>
              )}
            </div>

            {selectedCoupon && (
              <>
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1'>WhatsApp Message</label>
                  <textarea
                    rows={6}
                    value={blastMessage}
                    onChange={e => setBlastMessage(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none'
                    maxLength={1000}
                  />
                  <p className='text-[11px] text-gray-400 mt-1'>{blastMessage.length}/1000 — <span className='font-mono'>{'{{name}}'}</span> = customer name, <span className='font-mono'>{'{{code}}'}</span> = coupon code</p>
                </div>

                <div className='bg-gray-50 border rounded-xl p-3 text-xs text-gray-600 space-y-1'>
                  <p className='font-semibold text-gray-700'>Preview (your message will look like this):</p>
                  <p className='whitespace-pre-wrap text-gray-500'>{blastMessage.replace(/{{name}}/gi, 'Priya').replace(/{{code}}/gi, selectedCoupon.code)}</p>
                </div>

                <button
                  onClick={async () => {
                    if (!blastMessage.trim()) return toast.error('Please enter a message')
                    if (!window.confirm(`Send this offer to ALL active customers with WhatsApp numbers?`)) return
                    setBlastLoading(true)
                    setBlastResult(null)
                    try {
                      const res = await Axios({
                        ...SummaryApi.couponOfferBlast,
                        data: { couponCode: selectedCoupon.code, message: blastMessage }
                      })
                      if (res.data.success) {
                        setBlastResult(res.data.data)
                        toast.success(res.data.message)
                      }
                    } catch (e) {
                      toast.error(e.response?.data?.message || 'Blast failed')
                    } finally { setBlastLoading(false) }
                  }}
                  disabled={blastLoading || !blastMessage.trim()}
                  className='w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold rounded-xl py-3 transition-colors'
                >
                  {blastLoading
                    ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Sending to all customers...</>
                    : <><FaWhatsapp size={16} /> Send Offer Blast</>
                  }
                </button>

                {blastResult && (
                  <div className='bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 flex gap-4'>
                    <span>✅ Sent: <strong>{blastResult.sent}</strong></span>
                    {blastResult.failed > 0 && <span>❌ Failed: <strong>{blastResult.failed}</strong></span>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Low Stock Threshold Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-red-50'>
              <FaExclamationTriangle className='text-red-400' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Low Stock Alert Threshold</h2>
              <p className='text-xs text-gray-500'>Get WhatsApp alert when product stock falls to this level</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Alert when stock is ≤ (units)</label>
              <input
                type='number'
                min='0'
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(e.target.value)}
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition'
              />
              <p className='text-[11px] text-gray-400 mt-1'>Default is 5. Set 0 to disable alerts. Requires Admin WhatsApp number above.</p>
            </div>
            <button
              onClick={async () => {
                setSavingLowStock(true)
                try {
                  await saveSetting('low_stock_threshold', lowStockThreshold)
                  toast.success('Low stock threshold saved!')
                } catch { toast.error('Failed to save') }
                finally { setSavingLowStock(false) }
              }}
              disabled={savingLowStock}
              className='w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-xl py-3 transition-colors'
            >
              {savingLowStock ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingLowStock ? 'Saving...' : 'Save Threshold'}
            </button>
          </div>
        </div>

        {/* ── Return Period Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50'>
              <FaUndoAlt className='text-orange-500' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Return Policy Period</h2>
              <p className='text-xs text-gray-500'>Number of days customers can request a return after delivery</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700'>
              After this many days from delivery, the <strong>"Request Return"</strong> button will be <strong>disabled</strong> for customers on their order details page.
            </div>
            <div className='flex items-center gap-4'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Return Window (days)</label>
                <input
                  type='number'
                  min='1'
                  max='365'
                  value={returnPeriodDays}
                  onChange={e => setReturnPeriodDays(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition'
                  placeholder='e.g. 7'
                />
                <p className='text-[11px] text-gray-400 mt-1'>Common values: 7 days (1 week), 14 days (2 weeks), 30 days (1 month)</p>
              </div>
              <div className='w-20 h-20 rounded-2xl bg-orange-50 flex flex-col items-center justify-center border-2 border-orange-100 flex-shrink-0'>
                <p className='text-2xl font-black text-orange-600'>{returnPeriodDays || '—'}</p>
                <p className='text-[10px] text-orange-400 font-semibold'>DAYS</p>
              </div>
            </div>
            <button
              onClick={handleSaveReturnPeriod}
              disabled={savingReturn}
              className='w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors'
            >
              {savingReturn ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingReturn ? 'Saving...' : 'Save Return Period'}
            </button>
          </div>
        </div>

        {/* ── Outside Delivery Time Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100'>
              <FaBan className='text-blue-500 rotate-45' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Outside Delivery Time</h2>
              <p className='text-xs text-gray-500'>Shown on product page when pincode is not in any delivery zone</p>
            </div>
          </div>
          <div className='p-5 space-y-3'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Delivery Time Label</label>
              <input
                type='text'
                value={outsideDeliveryTime}
                onChange={e => setOutsideDeliveryTime(e.target.value)}
                placeholder='3-4 days'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
              />
              <p className='text-xs text-gray-400 mt-1'>Example: "3-4 days", "5-7 business days", "2-5 days"</p>
            </div>
            <button
              onClick={handleSaveOutsideDelivery}
              disabled={savingOutsideDelivery}
              className='w-full flex items-center justify-center gap-2 btn-primary font-semibold rounded-xl py-3 transition-colors disabled:opacity-50'
            >
              {savingOutsideDelivery ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingOutsideDelivery ? 'Saving...' : 'Save Delivery Time'}
            </button>
          </div>
        </div>

        {/* ── Announcement / Marquee Bar Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between p-5 border-b'>
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${announcementEnabled ? 'bg-primary/10' : 'bg-gray-100'}`}>
                <FaBullhorn className={announcementEnabled ? 'text-primary' : 'text-gray-400'} size={17} />
              </div>
              <div>
                <h2 className='font-bold text-gray-800'>Announcement Bar</h2>
                <p className='text-xs text-gray-500'>Scrolling text strip at the top of the site</p>
              </div>
            </div>
            <button
              onClick={() => setAnnouncementEnabled(prev => !prev)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${announcementEnabled ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${announcementEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className={`px-5 py-2 text-xs font-semibold ${announcementEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {announcementEnabled ? '✓ Announcement bar is visible to all visitors' : '○ Announcement bar is hidden'}
          </div>
          <div className='p-5 space-y-3'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Announcement Text</label>
              <input
                type='text'
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder='Free delivery above ₹999'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
              />
              <p className='text-xs text-gray-400 mt-1'>This text scrolls across the top of every page</p>
            </div>
            <button
              onClick={handleSaveAnnouncement}
              disabled={savingAnnouncement}
              className='w-full flex items-center justify-center gap-2 btn-primary font-semibold rounded-xl py-3 transition-colors disabled:opacity-50'
            >
              {savingAnnouncement ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingAnnouncement ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </div>

        {/* ── Maintenance Mode Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between p-5 border-b'>
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenanceMode ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <FaTools className={maintenanceMode ? 'text-orange-500' : 'text-gray-400'} size={18} />
              </div>
              <div>
                <h2 className='font-bold text-gray-800'>Maintenance Mode</h2>
                <p className='text-xs text-gray-500'>Show a maintenance page to all customers</p>
              </div>
            </div>
            <button
              onClick={handleToggleMaintenance}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${maintenanceMode ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className={`px-5 py-2 text-xs font-semibold ${maintenanceMode ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
            {maintenanceMode ? '⚠ Maintenance mode ON — customers will see maintenance page (admins bypass this)' : '✓ Site is live — customers can shop normally'}
          </div>
          <div className='p-5 space-y-3'>
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Maintenance Message</label>
              <textarea
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                rows={3}
                placeholder='We are currently under maintenance. Please check back soon.'
                className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none'
              />
            </div>
            <button
              onClick={handleSaveMaintenance}
              disabled={savingMaintenance}
              className={`w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 transition-colors text-white disabled:opacity-50 ${maintenanceMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {savingMaintenance ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <MdSave size={18} />}
              {savingMaintenance ? 'Saving...' : maintenanceMode ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
            </button>
          </div>
        </div>

        {/* ── COD Restriction Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between p-5 border-b'>
            <div className='flex items-center gap-3'>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${codEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                <FaBan className={codEnabled ? 'text-green-500' : 'text-red-500'} size={18} />
              </div>
              <div>
                <h2 className='font-bold text-gray-800'>Cash on Delivery (COD)</h2>
                <p className='text-xs text-gray-500'>Allow customers to pay via COD at checkout</p>
              </div>
            </div>
            <button
              onClick={handleToggleCod}
              disabled={savingCod}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${codEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${codEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className={`px-5 py-2 text-xs font-semibold ${codEnabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
            {codEnabled ? '✓ COD is available — customers can pay cash on delivery' : '✕ COD is disabled — only Razorpay / Wallet payments accepted'}
          </div>
        </div>

        {/* ── Loyalty Points Settings ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b bg-gradient-to-r from-yellow-50 to-orange-50'>
            <div className='w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center'>
              <span className='text-yellow-600 text-xl'>🏆</span>
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Loyalty Points Program</h2>
              <p className='text-xs text-gray-500'>Configure how customers earn and redeem points</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Points per ₹100 spent</label>
                <input
                  type='number' min='1' max='100' step='1'
                  value={loyaltyEarnPer100}
                  onChange={e => setLoyaltyEarnPer100(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
                <p className='text-[10px] text-gray-400 mt-1'>e.g. 10 = earn 10 pts per ₹100</p>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>₹ value per point</label>
                <input
                  type='number' min='0.01' max='10' step='0.01'
                  value={loyaltyPointValue}
                  onChange={e => setLoyaltyPointValue(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
                <p className='text-[10px] text-gray-400 mt-1'>e.g. 0.25 = 1 pt = ₹0.25</p>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Min points to redeem</label>
                <input
                  type='number' min='1' step='1'
                  value={loyaltyMinRedeem}
                  onChange={e => setLoyaltyMinRedeem(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
                <p className='text-[10px] text-gray-400 mt-1'>Minimum balance needed to redeem</p>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Max redeem % of order</label>
                <input
                  type='number' min='1' max='100' step='1'
                  value={loyaltyMaxRedeemPct}
                  onChange={e => setLoyaltyMaxRedeemPct(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
                <p className='text-[10px] text-gray-400 mt-1'>e.g. 50 = redeem up to 50% of order</p>
              </div>
              <div className='col-span-2'>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>
                  Wallet credit delay (days after delivery)
                </label>
                <input
                  type='number' min='1' max='60' step='1'
                  value={loyaltyReturnPeriodDays}
                  onChange={e => setLoyaltyReturnPeriodDays(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-400'
                />
                <p className='text-[10px] text-gray-400 mt-1'>
                  Earned points are converted to wallet balance after this many days (return window). Default: 7 days.
                </p>
              </div>
            </div>
            <div className='bg-yellow-50 rounded-xl p-3 text-xs text-yellow-700 space-y-0.5'>
              <p><strong>How it works:</strong> Points are earned on every order but held for the return window.</p>
              <p>
                ₹1000 order → <strong>{Math.floor(1000 / 100) * (parseFloat(loyaltyEarnPer100) || 10)} pts</strong> earned.
                After {parseInt(loyaltyReturnPeriodDays) || 7} days → <strong>₹{(Math.floor(1000 / 100) * (parseFloat(loyaltyEarnPer100) || 10) * (parseFloat(loyaltyPointValue) || 0.25)).toFixed(2)}</strong> credited to customer's wallet automatically.
              </p>
            </div>
            <button
              onClick={handleSaveLoyalty}
              disabled={savingLoyalty}
              className='btn-primary px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2'
            >
              {savingLoyalty && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />}
              Save Loyalty Settings
            </button>
          </div>
        </div>

        {/* ── Abandoned Cart Recovery ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b bg-gradient-to-r from-orange-50 to-red-50'>
            <div className='w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center'>
              <span className='text-orange-600 text-xl'>🛒</span>
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Abandoned Cart Recovery</h2>
              <p className='text-xs text-gray-500'>Send WhatsApp + email reminders to customers who left items in cart</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='flex gap-3 items-end'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Hours since last cart activity</label>
                <input
                  type='number' min='1' max='72' step='1'
                  value={cartHoursThreshold}
                  onChange={e => setCartHoursThreshold(e.target.value)}
                  onBlur={() => fetchAbandonedCartStats(cartHoursThreshold)}
                  className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400'
                />
              </div>
              <button onClick={() => fetchAbandonedCartStats(cartHoursThreshold)}
                className='px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap'>
                Check Stats
              </button>
            </div>
            {cartAbandoned && (
              <div className='bg-orange-50 rounded-xl p-3 text-sm text-orange-700 font-medium'>
                🛒 <strong>{cartAbandoned.total}</strong> customer{cartAbandoned.total !== 1 ? 's' : ''} have abandoned carts older than {cartAbandoned.hoursThreshold}h
              </div>
            )}
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>
                Custom message <span className='text-gray-400 font-normal'>(optional — use {'{{name}}'} and {'{{items}}'})</span>
              </label>
              <textarea
                rows={3}
                value={cartRecoveryMessage}
                onChange={e => setCartRecoveryMessage(e.target.value)}
                placeholder={`Hi {{name}}, you left {{items}} item(s) in your cart! Complete your order before they sell out. 🛍️`}
                className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none'
              />
              <p className='text-[10px] text-gray-400 mt-1'>Leave blank to use the default message.</p>
            </div>
            {cartRecoveryResult && (
              <div className='grid grid-cols-3 gap-3'>
                <div className='bg-green-50 rounded-xl p-3 text-center'>
                  <p className='text-2xl font-black text-green-600'>{cartRecoveryResult.notified}</p>
                  <p className='text-xs text-green-700'>Notified</p>
                </div>
                <div className='bg-gray-50 rounded-xl p-3 text-center'>
                  <p className='text-2xl font-black text-gray-500'>{cartRecoveryResult.skipped}</p>
                  <p className='text-xs text-gray-500'>Skipped</p>
                </div>
                <div className='bg-red-50 rounded-xl p-3 text-center'>
                  <p className='text-2xl font-black text-red-400'>{cartRecoveryResult.failed}</p>
                  <p className='text-xs text-red-400'>Failed</p>
                </div>
              </div>
            )}
            <button
              onClick={handleCartRecovery}
              disabled={cartRecoveryLoading}
              className='w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {cartRecoveryLoading
                ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Running Recovery...</>
                : '🚀 Run Cart Recovery Now'
              }
            </button>
          </div>
        </div>

        {/* ── Flash Sale Countdown Card ── */}
        <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
          <div className='flex items-center gap-3 p-5 border-b bg-gradient-to-r from-red-50 to-orange-50'>
            <div className='w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center'>
              <FaBolt className='text-red-500' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Flash Sale Countdown</h2>
              <p className='text-xs text-gray-500'>Show a live countdown banner on the home page</p>
            </div>
          </div>
          <div className='p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-semibold text-gray-700'>Enable Flash Sale Banner</p>
                <p className='text-xs text-gray-400'>Shows a red countdown strip above the home banner</p>
              </div>
              <button
                onClick={() => setFlashSaleEnabled(p => !p)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${flashSaleEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${flashSaleEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className='grid gap-3'>
              <div>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>Sale Title</label>
                <input type='text' value={flashSaleTitle} onChange={e => setFlashSaleTitle(e.target.value)}
                  placeholder='Flash Sale - Limited Time Offer!'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition' />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Discount Label</label>
                  <input type='text' value={flashSaleDiscount} onChange={e => setFlashSaleDiscount(e.target.value)}
                    placeholder='e.g. 30% or Up to 50%'
                    className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Sale Ends At</label>
                  <input type='datetime-local' value={flashSaleEndTime} onChange={e => setFlashSaleEndTime(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition' />
                </div>
              </div>
            </div>
            {flashSaleEnabled && (
              <div className='bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2'>
                <FaBolt className='text-red-400 flex-shrink-0' size={12} />
                <p className='text-xs text-red-600 font-medium'>Flash sale is ON — a countdown banner will appear on your home page</p>
              </div>
            )}
            <button onClick={handleSaveFlashSale} disabled={savingFlashSale}
              className='w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50 transition'>
              <MdSave size={16} />
              {savingFlashSale ? 'Saving...' : 'Save Flash Sale Settings'}
            </button>
          </div>
        </div>

        <p className='text-center text-xs text-gray-400 mt-4'>Changes take effect immediately on the live site</p>
      </div>
    </div>
  )
}

export default SiteSettings
