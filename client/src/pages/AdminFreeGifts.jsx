import React, { useEffect, useRef, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import {
  FaGift, FaPlus, FaTrash, FaEdit, FaCheckCircle,
  FaTimesCircle, FaTimes, FaSearch, FaUpload, FaImage
} from 'react-icons/fa'
import Loading from '../components/Loading'
import NoData from '../components/NoData'

const emptyForm = {
  mode: 'existing',
  productId: '',
  selectedProduct: null,
  customGift: { name: '', price: '', image: '' },
  title: '',
  minOrderAmount: '',
  isActive: true,
  startDate: '',
  endDate: '',
}

const AdminFreeGifts = () => {
  const [gifts, setGifts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editGift, setEditGift]   = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)

  const [productSearch, setProductSearch]   = useState('')
  const [productResults, setProductResults] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef()
  const searchTimer  = useRef()

  const fetchGifts = async () => {
    setLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.getAllFreeGifts })
      if (res.data.success) setGifts(res.data.data || [])
    } catch (err) { AxiosToastError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGifts() }, [])

  const loadProducts = async (q = '') => {
    setProductsLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.searchProduct, data: { search: q || ' ', page: 1, limit: 30 } })
      if (res.data.success) setProductResults(res.data.data || [])
    } catch {} finally { setProductsLoading(false) }
  }

  const handleProductSearch = (q) => {
    setProductSearch(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadProducts(q), 350)
  }

  const openCreate = () => {
    setEditGift(null)
    setForm(emptyForm)
    setProductSearch('')
    setProductResults([])
    setShowModal(true)
    setTimeout(() => loadProducts(), 100)
  }

  const openEdit = (gift) => {
    setEditGift(gift)
    const hasProduct    = !!gift.productId
    const hasCustomGift = !hasProduct && gift.customGift?.name
    setForm({
      mode:             hasProduct ? 'existing' : 'new',
      productId:        hasProduct ? String(gift.productId._id || gift.productId) : '',
      selectedProduct:  hasProduct ? gift.productId : null,
      customGift: {
        name:  hasCustomGift ? gift.customGift.name  : '',
        price: hasCustomGift ? String(gift.customGift.price) : '',
        image: hasCustomGift ? gift.customGift.image : '',
      },
      title:          gift.title || '',
      minOrderAmount: gift.minOrderAmount || '',
      isActive:       gift.isActive,
      startDate:      gift.startDate ? gift.startDate.slice(0, 10) : '',
      endDate:        gift.endDate   ? gift.endDate.slice(0, 10)   : '',
    })
    setProductSearch(hasProduct ? (gift.productId?.name || '') : '')
    setProductResults([])
    setShowModal(true)
    if (hasProduct) setTimeout(() => loadProducts(), 100)
  }

  const selectProduct = (p) => {
    setForm(f => ({ ...f, productId: String(p._id), selectedProduct: p }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    setImageUploading(true)
    try {
      const res = await Axios({ ...SummaryApi.uploadImage, data: fd })
      const url = res.data?.data?.url || res.data?.url || ''
      if (url) {
        setForm(f => ({ ...f, customGift: { ...f.customGift, image: url } }))
        toast.success('Image uploaded!')
      }
    } catch (err) { AxiosToastError(err) }
    finally { setImageUploading(false); e.target.value = '' }
  }

  const handleSave = async () => {
    if (form.mode === 'existing' && !form.productId) {
      toast.error('Please select a product'); return
    }
    if (form.mode === 'new' && (!form.customGift.name.trim() || !form.customGift.image)) {
      toast.error('Please fill in name and upload an image'); return
    }
    setSaving(true)
    try {
      const payload = {
        title:          form.title,
        minOrderAmount: form.minOrderAmount,
        isActive:       form.isActive,
        startDate:      form.startDate,
        endDate:        form.endDate,
        productId:      form.mode === 'existing' ? form.productId : '',
        customGift:     form.mode === 'new'
          ? { name: form.customGift.name, image: form.customGift.image, price: form.customGift.price }
          : { name: '', image: '', price: 0 },
      }
      let res
      if (editGift) {
        res = await Axios({ ...SummaryApi.updateFreeGift, url: `${SummaryApi.updateFreeGift.url}/${editGift._id}`, data: payload })
      } else {
        res = await Axios({ ...SummaryApi.createFreeGift, data: payload })
      }
      if (res.data.success) {
        toast.success(res.data.message)
        setShowModal(false)
        fetchGifts()
      }
    } catch (err) { AxiosToastError(err) }
    finally { setSaving(false) }
  }

  const handleToggle = async (gift) => {
    try {
      const res = await Axios({ ...SummaryApi.toggleFreeGift, url: `${SummaryApi.toggleFreeGift.url}/${gift._id}` })
      if (res.data.success) { toast.success(res.data.message); fetchGifts() }
    } catch (err) { AxiosToastError(err) }
  }

  const handleDelete = async (gift) => {
    if (!window.confirm(`Delete free gift offer "${gift.title}"?`)) return
    try {
      const res = await Axios({ ...SummaryApi.deleteFreeGift, url: `${SummaryApi.deleteFreeGift.url}/${gift._id}` })
      if (res.data.success) { toast.success(res.data.message); fetchGifts() }
    } catch (err) { AxiosToastError(err) }
  }

  const isExpired  = (g) => g.endDate && new Date(g.endDate) < new Date()
  const isUpcoming = (g) => g.startDate && new Date(g.startDate) > new Date()

  const getGiftProduct = (gift) => {
    if (gift.productId) return { name: gift.productId.name, image: gift.productId.image?.[0], price: gift.productId.price }
    if (gift.customGift?.name) return { name: gift.customGift.name, image: gift.customGift.image, price: gift.customGift.price }
    return { name: '—', image: null, price: null }
  }

  const filteredProducts = productSearch.trim()
    ? productResults.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
    : productResults

  return (
    <section className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-4xl mx-auto'>

        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center'>
              <FaGift className='text-rose-500' size={18} />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>Free Gift Offers</h1>
              <p className='text-sm text-gray-500'>Pick an existing product or add a new gift item</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className='flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-sm'
          >
            <FaPlus size={12} /> Add Offer
          </button>
        </div>

        {loading ? <Loading /> : gifts.length === 0 ? <NoData /> : (
          <div className='space-y-3'>
            {gifts.map(gift => {
              const expired   = isExpired(gift)
              const upcoming  = isUpcoming(gift)
              const gp        = getGiftProduct(gift)
              const isCustom  = !gift.productId && gift.customGift?.name
              const statusLabel = !gift.isActive ? 'Inactive' : expired ? 'Expired' : upcoming ? 'Upcoming' : 'Active'
              const statusColor = !gift.isActive ? 'text-gray-400 bg-gray-50'
                : expired  ? 'text-red-500 bg-red-50'
                : upcoming ? 'text-yellow-600 bg-yellow-50'
                : 'text-green-600 bg-green-50'

              return (
                <div key={gift._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!gift.isActive || expired ? 'opacity-70' : ''}`}>
                  <div className='flex items-start gap-4 p-4'>
                    <div className='w-16 h-16 rounded-xl bg-gray-50 border overflow-hidden flex-shrink-0'>
                      {gp.image
                        ? <img src={gp.image} alt={gp.name} className='w-full h-full object-contain p-1' />
                        : <FaGift className='m-auto mt-4 text-gray-300' size={24} />
                      }
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap mb-1'>
                        <span className='text-sm font-bold text-gray-800'>{gift.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusColor}`}>{statusLabel}</span>
                        {isCustom && (
                          <span className='text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-purple-50 text-purple-600'>Custom</span>
                        )}
                      </div>
                      <p className='text-xs text-gray-500 mb-1'>Gift: <span className='font-semibold text-gray-700'>{gp.name}</span>
                        {gp.price > 0 && <span className='text-gray-400 ml-1'>· ₹{gp.price}</span>}
                      </p>
                      <p className='text-xs text-gray-500'>
                        Min order: <span className='font-semibold text-gray-700'>
                          {gift.minOrderAmount > 0 ? `₹${gift.minOrderAmount.toLocaleString('en-IN')}` : 'No minimum'}
                        </span>
                      </p>
                      {(gift.startDate || gift.endDate) && (
                        <p className='text-[11px] text-gray-400 mt-1'>
                          {gift.startDate && `From ${new Date(gift.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          {gift.startDate && gift.endDate && ' · '}
                          {gift.endDate && `Until ${new Date(gift.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col items-end gap-2 flex-shrink-0'>
                      <div className='flex items-center gap-1'>
                        <button onClick={() => openEdit(gift)} title='Edit' className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition'>
                          <FaEdit size={13} />
                        </button>
                        <button onClick={() => handleToggle(gift)} title={gift.isActive ? 'Deactivate' : 'Activate'} className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition'>
                          {gift.isActive
                            ? <FaCheckCircle className='text-green-500' size={16} />
                            : <FaTimesCircle className='text-red-400' size={16} />}
                        </button>
                        <button onClick={() => handleDelete(gift)} title='Delete' className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition'>
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]'>

            {/* Modal Header */}
            <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <FaGift className='text-rose-500' size={18} />
                <h2 className='text-lg font-bold text-gray-800'>{editGift ? 'Edit Free Gift Offer' : 'New Free Gift Offer'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition'>
                <FaTimes size={16} />
              </button>
            </div>

            <div className='overflow-y-auto flex-1 px-6 py-4 space-y-4'>

              {/* Offer Title */}
              <div>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>Offer Title <span className='text-red-400'>*</span></label>
                <input
                  type='text'
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder='e.g. Free Scrunchie with every order!'
                  className='w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                />
              </div>

              {/* Mode Tabs */}
              <div>
                <label className='text-xs font-semibold text-gray-600 mb-2 block'>Gift Product <span className='text-red-400'>*</span></label>
                <div className='flex gap-1 bg-gray-100 p-1 rounded-xl mb-3'>
                  <button
                    onClick={() => setForm(f => ({ ...f, mode: 'existing' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${form.mode === 'existing' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Pick Existing Product
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, mode: 'new' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${form.mode === 'new' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Create New Gift Item
                  </button>
                </div>

                {/* ── Existing Product Picker ── */}
                {form.mode === 'existing' && (
                  <div>
                    {/* Selected product chip */}
                    {form.selectedProduct && (
                      <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2'>
                        {form.selectedProduct.image?.[0] && (
                          <img src={form.selectedProduct.image[0]} alt='' className='w-8 h-8 rounded-lg object-contain bg-white border' />
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs font-semibold text-green-800 line-clamp-1'>{form.selectedProduct.name}</p>
                          <p className='text-[10px] text-green-600'>₹{form.selectedProduct.price} · Selected ✓</p>
                        </div>
                        <button
                          onClick={() => setForm(f => ({ ...f, productId: '', selectedProduct: null }))}
                          className='text-green-400 hover:text-red-400 transition'
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}

                    {/* Search box */}
                    <div className='relative mb-2'>
                      <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
                      <input
                        type='text'
                        value={productSearch}
                        onChange={e => handleProductSearch(e.target.value)}
                        placeholder='Search products by name...'
                        className='w-full border rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                      />
                    </div>

                    {/* Product grid */}
                    <div className='border rounded-xl overflow-hidden'>
                      {productsLoading ? (
                        <div className='flex items-center justify-center py-6 text-gray-400 text-sm'>Loading products...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className='flex items-center justify-center py-6 text-gray-400 text-sm'>No products found</div>
                      ) : (
                        <div className='max-h-52 overflow-y-auto divide-y'>
                          {filteredProducts.map(p => {
                            const selected = form.productId === String(p._id)
                            return (
                              <button
                                key={p._id}
                                onClick={() => selectProduct(p)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${selected ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50'}`}
                              >
                                {p.image?.[0]
                                  ? <img src={p.image[0]} alt={p.name} className='w-10 h-10 rounded-lg object-contain bg-gray-50 border flex-shrink-0' />
                                  : <div className='w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0'><FaImage className='text-gray-300' size={14} /></div>
                                }
                                <div className='flex-1 min-w-0'>
                                  <p className={`text-sm font-medium line-clamp-1 ${selected ? 'text-primary' : 'text-gray-800'}`}>{p.name}</p>
                                  <p className='text-xs text-gray-400'>₹{p.price}{p.discount > 0 ? ` · ${p.discount}% off` : ''}</p>
                                </div>
                                {selected && <FaCheckCircle className='text-primary flex-shrink-0' size={14} />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── New Custom Gift ── */}
                {form.mode === 'new' && (
                  <div className='space-y-3'>
                    <div>
                      <label className='text-xs font-semibold text-gray-600 mb-1 block'>Gift Item Name <span className='text-red-400'>*</span></label>
                      <input
                        type='text'
                        value={form.customGift.name}
                        onChange={e => setForm(f => ({ ...f, customGift: { ...f.customGift, name: e.target.value } }))}
                        placeholder='e.g. Premium Scrunchie, Keychain, Bookmark...'
                        className='w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-semibold text-gray-600 mb-1 block'>Original Price (₹) <span className='text-gray-400 font-normal'>— shown to customer</span></label>
                      <input
                        type='number'
                        min='0'
                        value={form.customGift.price}
                        onChange={e => setForm(f => ({ ...f, customGift: { ...f.customGift, price: e.target.value } }))}
                        placeholder='e.g. 99'
                        className='w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-semibold text-gray-600 mb-1 block'>Gift Image <span className='text-red-400'>*</span></label>
                      {form.customGift.image ? (
                        <div className='flex items-center gap-3'>
                          <img src={form.customGift.image} alt='gift' className='w-20 h-20 rounded-xl object-contain border bg-gray-50' />
                          <button
                            onClick={() => setForm(f => ({ ...f, customGift: { ...f.customGift, image: '' } }))}
                            className='text-xs text-red-500 hover:underline'
                          >Remove</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading}
                          className='w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition disabled:opacity-60'
                        >
                          {imageUploading
                            ? <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                            : <FaUpload className='text-gray-400' size={20} />
                          }
                          <span className='text-sm text-gray-500'>{imageUploading ? 'Uploading...' : 'Click to upload image'}</span>
                        </button>
                      )}
                      <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleImageUpload} />
                    </div>
                  </div>
                )}
              </div>

              {/* Min Order Amount */}
              <div>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>Minimum Order Amount (₹)</label>
                <input
                  type='number'
                  min='0'
                  value={form.minOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder='0 = always free gift'
                  className='w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                />
                <p className='text-[11px] text-gray-400 mt-1'>Leave 0 to give gift on all orders</p>
              </div>

              {/* Dates */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Start Date</label>
                  <input type='date' value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className='w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>End Date</label>
                  <input type='date' value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className='w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition' />
                </div>
              </div>

              {/* Active */}
              <div className='flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3'>
                <input type='checkbox' id='giftActive' checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className='w-4 h-4 accent-primary' />
                <label htmlFor='giftActive' className='text-sm font-medium text-gray-700 cursor-pointer'>Active (visible to customers)</label>
              </div>
            </div>

            {/* Footer */}
            <div className='flex gap-3 px-6 py-4 border-t flex-shrink-0'>
              <button onClick={() => setShowModal(false)} className='flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition'>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (form.mode === 'existing' && !form.productId) || (form.mode === 'new' && (!form.customGift.name.trim() || !form.customGift.image))}
                className='flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {saving ? 'Saving...' : editGift ? 'Save Changes' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminFreeGifts
