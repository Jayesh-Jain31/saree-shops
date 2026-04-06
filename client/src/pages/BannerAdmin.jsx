import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import uploadImage from '../utils/UploadImage'
import toast from 'react-hot-toast'
import {
  MdAdd, MdEdit, MdDelete, MdImage, MdClose, MdSave,
  MdVisibility, MdVisibilityOff, MdArrowUpward, MdArrowDownward
} from 'react-icons/md'
import { FaImages, FaPlus, FaTrash } from 'react-icons/fa'

const MAX_SLIDES = 4
const MIN_SLIDES = 1

const emptySlide = { image: '', imageMobile: '', title: '', link: '' }

const emptyForm = {
  title: '',
  slides: [{ ...emptySlide }],
  isActive: true,
  displayOrder: 0,
}

const SlideEditor = ({ slide, index, total, onChange, onRemove, uploading, onUploadDesktop, onUploadMobile }) => (
  <div className='border border-gray-200 rounded-xl p-4 bg-gray-50 relative'>
    <div className='flex items-center justify-between mb-3'>
      <span className='text-xs font-bold text-gray-600 bg-white border rounded-full px-2.5 py-0.5'>Slide {index + 1}</span>
      {total > MIN_SLIDES && (
        <button
          type='button'
          onClick={() => onRemove(index)}
          className='w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors'
          title='Remove slide'
        >
          <FaTrash size={11} />
        </button>
      )}
    </div>

    {/* Desktop image */}
    <div className='mb-3'>
      <label className='block text-[11px] font-semibold text-gray-500 mb-1'>
        Desktop Image <span className='text-red-500'>*</span>
        <span className='font-normal text-gray-400 ml-1'>(1400×400px recommended)</span>
      </label>
      {slide.image ? (
        <div className='relative rounded-lg overflow-hidden border border-gray-200' style={{ height: '110px' }}>
          <img src={slide.image} alt='desktop' className='w-full h-full object-cover' />
          <button
            type='button'
            onClick={() => onChange(index, 'image', '')}
            className='absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 border rounded-md flex items-center justify-center text-red-500'
          >
            <MdClose size={13} />
          </button>
        </div>
      ) : (
        <label className='flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors' style={{ height: '80px' }}>
          {uploading?.desktop === index ? (
            <div className='w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
          ) : (
            <>
              <MdImage className='text-gray-300 mb-1' size={22} />
              <span className='text-xs text-gray-400'>Click to upload</span>
            </>
          )}
          <input type='file' accept='image/*' className='hidden'
            onChange={e => onUploadDesktop(e, index)} disabled={uploading?.desktop === index} />
        </label>
      )}
    </div>

    {/* Mobile image */}
    <div className='mb-3'>
      <label className='block text-[11px] font-semibold text-gray-500 mb-1'>
        Mobile Image <span className='font-normal text-gray-400'>(optional · 800×400px)</span>
      </label>
      {slide.imageMobile ? (
        <div className='relative rounded-lg overflow-hidden border border-gray-200' style={{ height: '80px' }}>
          <img src={slide.imageMobile} alt='mobile' className='w-full h-full object-cover' />
          <button
            type='button'
            onClick={() => onChange(index, 'imageMobile', '')}
            className='absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 border rounded-md flex items-center justify-center text-red-500'
          >
            <MdClose size={13} />
          </button>
        </div>
      ) : (
        <label className='flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors' style={{ height: '60px' }}>
          {uploading?.mobile === index ? (
            <div className='w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin'></div>
          ) : (
            <span className='text-xs text-gray-400'>+ Mobile image</span>
          )}
          <input type='file' accept='image/*' className='hidden'
            onChange={e => onUploadMobile(e, index)} disabled={uploading?.mobile === index} />
        </label>
      )}
    </div>

    {/* Slide title & link */}
    <div className='grid grid-cols-2 gap-2'>
      <div>
        <label className='block text-[11px] font-semibold text-gray-500 mb-1'>Slide Title</label>
        <input
          type='text'
          value={slide.title}
          onChange={e => onChange(index, 'title', e.target.value)}
          placeholder='e.g. Summer Sale'
          className='w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-green-500'
        />
      </div>
      <div>
        <label className='block text-[11px] font-semibold text-gray-500 mb-1'>Click Link</label>
        <input
          type='text'
          value={slide.link}
          onChange={e => onChange(index, 'link', e.target.value)}
          placeholder='/category or URL'
          className='w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-green-500'
        />
      </div>
    </div>
  </div>
)

const BannerAdmin = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [previewSlide, setPreviewSlide] = useState({})

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const res = await Axios({ ...SummaryApi.getAllBannersAdmin })
      if (res.data.success) setBanners(res.data.data)
    } catch { toast.error('Failed to load banners') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBanners() }, [])

  // Normalize old single-image banners to slides format
  const normalizeBanner = (banner) => {
    if (banner.slides && banner.slides.length > 0) return banner.slides
    if (banner.image) return [{ image: banner.image, imageMobile: banner.imageMobile || '', title: banner.title || '', link: banner.link || '' }]
    return [{ ...emptySlide }]
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, slides: [{ ...emptySlide }], displayOrder: banners.length })
    setShowForm(true)
  }

  const openEdit = (banner) => {
    setEditingId(banner._id)
    setForm({
      title: banner.title || '',
      slides: normalizeBanner(banner),
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    })
    setShowForm(true)
  }

  const handleSlideChange = (index, field, value) => {
    setForm(f => {
      const slides = [...f.slides]
      slides[index] = { ...slides[index], [field]: value }
      return { ...f, slides }
    })
  }

  const addSlide = () => {
    if (form.slides.length >= MAX_SLIDES) {
      toast.error(`Maximum ${MAX_SLIDES} slides allowed`)
      return
    }
    setForm(f => ({ ...f, slides: [...f.slides, { ...emptySlide }] }))
  }

  const removeSlide = (index) => {
    setForm(f => ({ ...f, slides: f.slides.filter((_, i) => i !== index) }))
  }

  const handleUploadDesktop = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(u => ({ ...u, desktop: index }))
    try {
      const res = await uploadImage(file)
      if (res?.data?.data?.url) {
        handleSlideChange(index, 'image', res.data.data.url)
        toast.success('Image uploaded')
      } else toast.error('Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setUploading(u => ({ ...u, desktop: undefined })) }
  }

  const handleUploadMobile = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(u => ({ ...u, mobile: index }))
    try {
      const res = await uploadImage(file)
      if (res?.data?.data?.url) {
        handleSlideChange(index, 'imageMobile', res.data.data.url)
        toast.success('Mobile image uploaded')
      } else toast.error('Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setUploading(u => ({ ...u, mobile: undefined })) }
  }

  const handleSave = async () => {
    const validSlides = form.slides.filter(s => s.image)
    if (validSlides.length === 0) {
      toast.error('Please upload at least one desktop image')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        slides: validSlides,
        image: validSlides[0]?.image || '',
        imageMobile: validSlides[0]?.imageMobile || '',
        link: validSlides[0]?.link || '',
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      }
      let res
      if (editingId) {
        res = await Axios({ ...SummaryApi.updateBanner, url: `${SummaryApi.updateBanner.url}/${editingId}`, data: payload })
      } else {
        res = await Axios({ ...SummaryApi.createBanner, data: payload })
      }
      if (res.data.success) {
        toast.success(editingId ? 'Banner updated' : 'Banner created')
        setShowForm(false)
        fetchBanners()
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      const res = await Axios({ ...SummaryApi.deleteBanner, url: `${SummaryApi.deleteBanner.url}/${id}` })
      if (res.data.success) {
        toast.success('Banner deleted')
        setDeleteId(null)
        fetchBanners()
      }
    } catch { toast.error('Failed to delete') }
  }

  const handleToggleActive = async (banner) => {
    try {
      const res = await Axios({
        ...SummaryApi.updateBanner,
        url: `${SummaryApi.updateBanner.url}/${banner._id}`,
        data: { ...banner, isActive: !banner.isActive },
      })
      if (res.data.success) {
        toast.success(banner.isActive ? 'Banner hidden' : 'Banner visible')
        fetchBanners()
      }
    } catch { toast.error('Failed to update') }
  }

  const handleReorder = async (banner, direction) => {
    const idx = banners.findIndex(b => b._id === banner._id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return
    const swapBanner = banners[swapIdx]
    try {
      await Promise.all([
        Axios({ ...SummaryApi.updateBanner, url: `${SummaryApi.updateBanner.url}/${banner._id}`, data: { ...banner, displayOrder: swapBanner.displayOrder } }),
        Axios({ ...SummaryApi.updateBanner, url: `${SummaryApi.updateBanner.url}/${swapBanner._id}`, data: { ...swapBanner, displayOrder: banner.displayOrder } }),
      ])
      fetchBanners()
    } catch { toast.error('Failed to reorder') }
  }

  const getBannerSlides = (banner) => {
    if (banner.slides && banner.slides.length > 0) return banner.slides
    if (banner.image) return [{ image: banner.image, imageMobile: banner.imageMobile || '', title: banner.title || '' }]
    return []
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
              <p className='text-xs text-gray-500'>{banners.length} banner{banners.length !== 1 ? 's' : ''} · each banner can have up to {MAX_SLIDES} slides</p>
            </div>
          </div>
          <button onClick={openCreate} className='flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm'>
            <MdAdd size={18} /> Add Banner
          </button>
        </div>
      </div>

      <div className='max-w-5xl mx-auto p-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700'>
          <strong>How it works:</strong> Each banner can contain <strong>2–4 slides</strong> that automatically rotate every 4 seconds on the homepage. Add multiple slides to create a rich carousel experience.
        </div>

        {loading ? (
          <div className='space-y-3'>{[1,2,3].map(i => <div key={i} className='bg-white rounded-xl border h-32 animate-pulse'></div>)}</div>
        ) : banners.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <FaImages size={48} className='mb-4' />
            <p className='font-semibold text-gray-500 text-lg'>No banners yet</p>
            <p className='text-sm mt-1 mb-4'>Add your first banner to show on the homepage</p>
            <button onClick={openCreate} className='flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700'>
              <MdAdd size={18} /> Create First Banner
            </button>
          </div>
        ) : (
          <div className='space-y-3'>
            {banners.map((banner, idx) => {
              const slides = getBannerSlides(banner)
              const currentSlide = previewSlide[banner._id] || 0
              return (
                <div key={banner._id} className={`bg-white rounded-xl border overflow-hidden shadow-sm ${!banner.isActive ? 'opacity-60' : ''}`}>
                  <div className='flex items-stretch'>
                    {/* Slides preview strip */}
                    <div className='flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col' style={{ width: '200px' }}>
                      {slides.length > 0 && (
                        <div className='relative' style={{ height: '110px' }}>
                          <img
                            src={slides[currentSlide]?.image || slides[0]?.image}
                            alt=''
                            className='w-full h-full object-cover'
                          />
                          {!banner.isActive && (
                            <div className='absolute inset-0 bg-white/60 flex items-center justify-center'>
                              <span className='text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border'>HIDDEN</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Slide thumbnails */}
                      {slides.length > 1 && (
                        <div className='flex gap-1 p-1.5 overflow-x-auto'>
                          {slides.map((slide, si) => (
                            <button
                              key={si}
                              onClick={() => setPreviewSlide(p => ({ ...p, [banner._id]: si }))}
                              className={`flex-shrink-0 w-8 h-8 rounded overflow-hidden border-2 transition-all ${(previewSlide[banner._id] || 0) === si ? 'border-green-500' : 'border-transparent'}`}
                            >
                              <img src={slide.image} alt='' className='w-full h-full object-cover' />
                            </button>
                          ))}
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
                          <div className='flex flex-wrap items-center gap-2 mt-2'>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${banner.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {banner.isActive ? 'Visible' : 'Hidden'}
                            </span>
                            <span className='text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200'>
                              {slides.length} slide{slides.length !== 1 ? 's' : ''}
                            </span>
                            <span className='text-[10px] text-gray-400'>Order: {banner.displayOrder}</span>
                          </div>
                          {slides.length > 1 && (
                            <p className='text-[10px] text-gray-400 mt-1'>Click thumbnails above to preview each slide</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-1 flex-shrink-0'>
                          <button onClick={() => handleReorder(banner, 'up')} disabled={idx === 0} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30'>
                            <MdArrowUpward size={15} />
                          </button>
                          <button onClick={() => handleReorder(banner, 'down')} disabled={idx === banners.length - 1} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30'>
                            <MdArrowDownward size={15} />
                          </button>
                          <button onClick={() => handleToggleActive(banner)} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50'>
                            {banner.isActive ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                          </button>
                          <button onClick={() => openEdit(banner)} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'>
                            <MdEdit size={15} />
                          </button>
                          <button onClick={() => setDeleteId(banner._id)} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50'>
                            <MdDelete size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[92vh] flex flex-col'>
            {/* Modal header */}
            <div className='flex items-center justify-between p-4 border-b flex-shrink-0'>
              <div>
                <h2 className='font-bold text-lg text-gray-800'>{editingId ? 'Edit Banner' : 'Add New Banner'}</h2>
                <p className='text-xs text-gray-400'>Add up to {MAX_SLIDES} slides that auto-rotate on the homepage</p>
              </div>
              <button onClick={() => setShowForm(false)} className='w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:bg-gray-50'>
                <MdClose size={18} />
              </button>
            </div>

            <div className='overflow-y-auto flex-1 p-4 space-y-4'>
              {/* Banner group title */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Banner Group Name <span className='font-normal text-gray-400'>(optional)</span></label>
                <input
                  type='text'
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='e.g. "Homepage Hero" or "Seasonal Sale"'
                  className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500'
                />
              </div>

              {/* Slides */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='text-xs font-semibold text-gray-600'>
                    Slides <span className='text-gray-400 font-normal'>({form.slides.length}/{MAX_SLIDES})</span>
                  </label>
                  {form.slides.length < MAX_SLIDES && (
                    <button
                      type='button'
                      onClick={addSlide}
                      className='flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition-colors'
                    >
                      <FaPlus size={10} /> Add Slide
                    </button>
                  )}
                </div>
                <div className='space-y-3'>
                  {form.slides.map((slide, i) => (
                    <SlideEditor
                      key={i}
                      slide={slide}
                      index={i}
                      total={form.slides.length}
                      onChange={handleSlideChange}
                      onRemove={removeSlide}
                      uploading={uploading}
                      onUploadDesktop={handleUploadDesktop}
                      onUploadMobile={handleUploadMobile}
                    />
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Display Order</label>
                  <input
                    type='number'
                    value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    min='0'
                    className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500'
                  />
                  <p className='text-[11px] text-gray-400 mt-1'>Lower = shown first</p>
                </div>
                <div className='flex flex-col justify-between'>
                  <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Visibility</label>
                  <div className='flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3'>
                    <span className='text-sm text-gray-700'>{form.isActive ? 'Visible' : 'Hidden'}</span>
                    <button
                      type='button'
                      onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='flex gap-3 p-4 border-t bg-gray-50 flex-shrink-0'>
              <button onClick={() => setShowForm(false)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white'>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || form.slides.every(s => !s.image)}
                className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div> : <MdSave size={16} />}
                {saving ? 'Saving…' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl'>
            <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <MdDelete className='text-red-500' size={24} />
            </div>
            <h3 className='font-bold text-gray-800 text-center text-lg mb-2'>Delete Banner?</h3>
            <p className='text-sm text-gray-500 text-center mb-5'>All slides in this banner will be permanently removed.</p>
            <div className='flex gap-3'>
              <button onClick={() => setDeleteId(null)} className='flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className='flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700'>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BannerAdmin
