import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import uploadImage from '../utils/UploadImage'
import toast from 'react-hot-toast'
import {
  MdAdd, MdEdit, MdDelete, MdImage, MdClose, MdSave,
  MdVisibility, MdVisibilityOff, MdDragIndicator, MdArrowUpward, MdArrowDownward
} from 'react-icons/md'
import { FaImages } from 'react-icons/fa'

const emptyForm = {
  title: '',
  image: '',
  imageMobile: '',
  link: '',
  isActive: true,
  displayOrder: 0,
}

const BannerAdmin = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploadingDesktop, setUploadingDesktop] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await Axios({ ...SummaryApi.getAllBannersAdmin })
      if (response.data.success) {
        setBanners(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanners() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, displayOrder: banners.length })
    setShowForm(true)
  }

  const openEdit = (banner) => {
    setEditingId(banner._id)
    setForm({
      title: banner.title || '',
      image: banner.image || '',
      imageMobile: banner.imageMobile || '',
      link: banner.link || '',
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    })
    setShowForm(true)
  }

  const handleUploadDesktop = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingDesktop(true)
    try {
      const res = await uploadImage(file)
      if (res?.data?.data?.url) {
        setForm(f => ({ ...f, image: res.data.data.url }))
        toast.success('Desktop image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingDesktop(false)
    }
  }

  const handleUploadMobile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingMobile(true)
    try {
      const res = await uploadImage(file)
      if (res?.data?.data?.url) {
        setForm(f => ({ ...f, imageMobile: res.data.data.url }))
        toast.success('Mobile image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingMobile(false)
    }
  }

  const handleSave = async () => {
    if (!form.image) {
      toast.error('Please upload a desktop banner image')
      return
    }
    setSaving(true)
    try {
      let response
      if (editingId) {
        response = await Axios({
          ...SummaryApi.updateBanner,
          url: `${SummaryApi.updateBanner.url}/${editingId}`,
          data: form,
        })
      } else {
        response = await Axios({ ...SummaryApi.createBanner, data: form })
      }
      if (response.data.success) {
        toast.success(editingId ? 'Banner updated' : 'Banner created')
        setShowForm(false)
        fetchBanners()
      }
    } catch (error) {
      toast.error('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteBanner,
        url: `${SummaryApi.deleteBanner.url}/${id}`,
      })
      if (response.data.success) {
        toast.success('Banner deleted')
        setDeleteId(null)
        fetchBanners()
      }
    } catch {
      toast.error('Failed to delete banner')
    }
  }

  const handleToggleActive = async (banner) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateBanner,
        url: `${SummaryApi.updateBanner.url}/${banner._id}`,
        data: { ...banner, isActive: !banner.isActive },
      })
      if (response.data.success) {
        toast.success(banner.isActive ? 'Banner hidden' : 'Banner visible')
        fetchBanners()
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleReorder = async (banner, direction) => {
    const idx = banners.findIndex(b => b._id === banner._id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return
    const swapBanner = banners[swapIdx]
    try {
      await Promise.all([
        Axios({
          ...SummaryApi.updateBanner,
          url: `${SummaryApi.updateBanner.url}/${banner._id}`,
          data: { ...banner, displayOrder: swapBanner.displayOrder },
        }),
        Axios({
          ...SummaryApi.updateBanner,
          url: `${SummaryApi.updateBanner.url}/${swapBanner._id}`,
          data: { ...swapBanner, displayOrder: banner.displayOrder },
        }),
      ])
      fetchBanners()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='max-w-5xl mx-auto p-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center'>
              <FaImages className='text-purple-600' size={18} />
            </div>
            <div>
              <h1 className='font-bold text-xl text-gray-800'>Banner Management</h1>
              <p className='text-xs text-gray-500'>{banners.length} banner{banners.length !== 1 ? 's' : ''} · drag to reorder</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className='flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm'
          >
            <MdAdd size={18} /> Add Banner
          </button>
        </div>
      </div>

      <div className='max-w-5xl mx-auto p-4'>
        {/* Preview note */}
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700'>
          <strong>Tip:</strong> Active banners appear as a rotating carousel on the home page. Upload both a desktop image (wide, e.g. 1400×400px) and a mobile image (e.g. 800×400px) for the best experience.
        </div>

        {loading ? (
          <div className='space-y-3'>
            {[1,2,3].map(i => (
              <div key={i} className='bg-white rounded-xl border border-gray-100 h-32 animate-pulse'></div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <FaImages size={48} className='mb-4' />
            <p className='font-semibold text-gray-500 text-lg'>No banners yet</p>
            <p className='text-sm mt-1 mb-4'>Add your first banner to show on the homepage</p>
            <button
              onClick={openCreate}
              className='flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700'
            >
              <MdAdd size={18} /> Create First Banner
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            {banners.map((banner, idx) => (
              <div
                key={banner._id}
                className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${banner.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
              >
                <div className='flex items-stretch'>
                  {/* Preview */}
                  <div className='w-40 sm:w-56 flex-shrink-0 bg-gray-50 border-r border-gray-100 relative overflow-hidden'>
                    {banner.image ? (
                      <img src={banner.image} alt={banner.title} className='w-full h-full object-cover' style={{ minHeight: '100px' }} />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center' style={{ minHeight: '100px' }}>
                        <MdImage className='text-gray-300' size={32} />
                      </div>
                    )}
                    {!banner.isActive && (
                      <div className='absolute inset-0 bg-white/60 flex items-center justify-center'>
                        <span className='text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded-full border'>HIDDEN</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className='flex-1 p-4 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='font-semibold text-gray-800 text-sm line-clamp-1'>
                          {banner.title || <span className='text-gray-400 italic'>No title</span>}
                        </p>
                        {banner.link && (
                          <p className='text-[11px] text-blue-500 truncate mt-0.5'>🔗 {banner.link}</p>
                        )}
                        <div className='flex items-center gap-2 mt-2'>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${banner.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {banner.isActive ? 'Visible' : 'Hidden'}
                          </span>
                          {banner.imageMobile && (
                            <span className='text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200'>
                              Mobile ✓
                            </span>
                          )}
                          <span className='text-[10px] text-gray-400'>Order: {banner.displayOrder}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <button
                          onClick={() => handleReorder(banner, 'up')}
                          disabled={idx === 0}
                          className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30'
                          title='Move up'
                        >
                          <MdArrowUpward size={15} />
                        </button>
                        <button
                          onClick={() => handleReorder(banner, 'down')}
                          disabled={idx === banners.length - 1}
                          className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30'
                          title='Move down'
                        >
                          <MdArrowDownward size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50'
                          title={banner.isActive ? 'Hide banner' : 'Show banner'}
                        >
                          {banner.isActive ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                        </button>
                        <button
                          onClick={() => openEdit(banner)}
                          className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                          title='Edit banner'
                        >
                          <MdEdit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(banner._id)}
                          className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50'
                          title='Delete banner'
                        >
                          <MdDelete size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto'>
            {/* Modal header */}
            <div className='flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10'>
              <h2 className='font-bold text-lg text-gray-800'>{editingId ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button
                onClick={() => setShowForm(false)}
                className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:bg-gray-50'
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className='p-4 space-y-5'>
              {/* Title */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Banner Title <span className='font-normal text-gray-400'>(optional)</span></label>
                <input
                  type='text'
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='e.g. Summer Sale, New Arrivals...'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100'
                />
              </div>

              {/* Desktop Image */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>
                  Desktop Banner Image <span className='text-red-500'>*</span>
                  <span className='font-normal text-gray-400 ml-1'>(recommended: 1400×400px)</span>
                </label>
                {form.image ? (
                  <div className='relative rounded-xl overflow-hidden border border-gray-200 mb-2' style={{ height: '140px' }}>
                    <img src={form.image} alt='desktop preview' className='w-full h-full object-cover' />
                    <button
                      onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className='absolute top-2 right-2 w-7 h-7 bg-white/90 border rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50'
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                ) : (
                  <label className='flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mb-2'>
                    {uploadingDesktop ? (
                      <div className='w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <>
                        <MdImage className='text-gray-300 mb-2' size={32} />
                        <span className='text-sm text-gray-500 font-medium'>Click to upload desktop image</span>
                        <span className='text-xs text-gray-400 mt-1'>PNG, JPG, WEBP up to 10MB</span>
                      </>
                    )}
                    <input type='file' accept='image/*' className='hidden' onChange={handleUploadDesktop} disabled={uploadingDesktop} />
                  </label>
                )}
              </div>

              {/* Mobile Image */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>
                  Mobile Banner Image <span className='font-normal text-gray-400'>(optional · recommended: 800×400px)</span>
                </label>
                {form.imageMobile ? (
                  <div className='relative rounded-xl overflow-hidden border border-gray-200 mb-2' style={{ height: '120px' }}>
                    <img src={form.imageMobile} alt='mobile preview' className='w-full h-full object-cover' />
                    <button
                      onClick={() => setForm(f => ({ ...f, imageMobile: '' }))}
                      className='absolute top-2 right-2 w-7 h-7 bg-white/90 border rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50'
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                ) : (
                  <label className='flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors mb-2'>
                    {uploadingMobile ? (
                      <div className='w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <>
                        <MdImage className='text-gray-300 mb-2' size={28} />
                        <span className='text-sm text-gray-500 font-medium'>Click to upload mobile image</span>
                        <span className='text-xs text-gray-400 mt-1'>If not set, desktop image is used on mobile</span>
                      </>
                    )}
                    <input type='file' accept='image/*' className='hidden' onChange={handleUploadMobile} disabled={uploadingMobile} />
                  </label>
                )}
              </div>

              {/* Link */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>
                  Click Link <span className='font-normal text-gray-400'>(optional — where the banner navigates when clicked)</span>
                </label>
                <input
                  type='text'
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder='e.g. /cotton-sarees-123/sarees-456 or https://...'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100'
                />
              </div>

              {/* Display Order */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Display Order</label>
                <input
                  type='number'
                  value={form.displayOrder}
                  onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                  min='0'
                  className='w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500'
                />
                <p className='text-[11px] text-gray-400 mt-1'>Lower number = shown first</p>
              </div>

              {/* Active toggle */}
              <div className='flex items-center justify-between bg-gray-50 rounded-xl p-3'>
                <div>
                  <p className='text-sm font-semibold text-gray-700'>Show on Homepage</p>
                  <p className='text-[11px] text-gray-400'>When off, this banner is hidden from customers</p>
                </div>
                <button
                  type='button'
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className='flex items-center gap-3 p-4 border-t bg-gray-50'>
              <button
                onClick={() => setShowForm(false)}
                className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.image}
                className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {saving ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  <MdSave size={16} />
                )}
                {saving ? 'Saving…' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl'>
            <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <MdDelete className='text-red-500' size={24} />
            </div>
            <h3 className='font-bold text-gray-800 text-center text-lg mb-2'>Delete Banner?</h3>
            <p className='text-sm text-gray-500 text-center mb-5'>This banner will be permanently removed from the homepage.</p>
            <div className='flex gap-3'>
              <button
                onClick={() => setDeleteId(null)}
                className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className='flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BannerAdmin
