import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { FaGift, FaPlus, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa'
import Loading from '../components/Loading'
import NoData from '../components/NoData'

const emptyForm = {
  productId: '',
  title: '',
  minOrderAmount: '',
  isActive: true,
  startDate: '',
  endDate: '',
}

const AdminFreeGifts = () => {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editGift, setEditGift] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const fetchGifts = async () => {
    setLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.getAllFreeGifts })
      if (res.data.success) setGifts(res.data.data || [])
    } catch (err) { AxiosToastError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGifts() }, [])

  const openCreate = () => {
    setEditGift(null)
    setForm(emptyForm)
    setProductSearch('')
    setProductResults([])
    setShowModal(true)
  }

  const openEdit = (gift) => {
    setEditGift(gift)
    setForm({
      productId: String(gift.productId?._id || gift.productId || ''),
      title: gift.title || '',
      minOrderAmount: gift.minOrderAmount || '',
      isActive: gift.isActive,
      startDate: gift.startDate ? gift.startDate.slice(0, 10) : '',
      endDate: gift.endDate ? gift.endDate.slice(0, 10) : '',
    })
    setProductSearch(gift.productId?.name || '')
    setProductResults([])
    setShowModal(true)
  }

  const handleProductSearch = async (q) => {
    setProductSearch(q)
    if (!q.trim()) { setProductResults([]); return }
    setSearchLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.searchProduct, data: { search: q, page: 1, limit: 10 } })
      if (res.data.success) setProductResults(res.data.data || [])
    } catch {} finally { setSearchLoading(false) }
  }

  const selectProduct = (p) => {
    setForm(f => ({ ...f, productId: String(p._id) }))
    setProductSearch(p.name)
    setProductResults([])
  }

  const handleSave = async () => {
    if (!form.productId) { toast.error('Please select a product'); return }
    setSaving(true)
    try {
      let res
      if (editGift) {
        res = await Axios({ ...SummaryApi.updateFreeGift, url: `${SummaryApi.updateFreeGift.url}/${editGift._id}`, data: form })
      } else {
        res = await Axios({ ...SummaryApi.createFreeGift, data: form })
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

  const isExpired = (g) => g.endDate && new Date(g.endDate) < new Date()
  const isUpcoming = (g) => g.startDate && new Date(g.startDate) > new Date()

  return (
    <section className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-4xl mx-auto'>

        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center'>
              <FaGift className='text-rose-500' size={18} />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>Free Gift Offers</h1>
              <p className='text-sm text-gray-500'>Attach a free product to orders above a minimum cart value</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className='flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-sm'
          >
            <FaPlus size={12} /> Add Offer
          </button>
        </div>

        {/* List */}
        {loading ? (
          <Loading />
        ) : gifts.length === 0 ? (
          <NoData />
        ) : (
          <div className='space-y-3'>
            {gifts.map(gift => {
              const expired = isExpired(gift)
              const upcoming = isUpcoming(gift)
              const product = gift.productId
              const statusLabel = !gift.isActive ? 'Inactive'
                : expired ? 'Expired'
                : upcoming ? 'Upcoming'
                : 'Active'
              const statusColor = !gift.isActive ? 'text-gray-400 bg-gray-50'
                : expired ? 'text-red-500 bg-red-50'
                : upcoming ? 'text-yellow-600 bg-yellow-50'
                : 'text-green-600 bg-green-50'

              return (
                <div key={gift._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!gift.isActive || expired ? 'opacity-70' : ''}`}>
                  <div className='flex items-start gap-4 p-4'>
                    {/* Product Image */}
                    <div className='w-16 h-16 rounded-xl bg-gray-50 border overflow-hidden flex-shrink-0'>
                      {product?.image?.[0]
                        ? <img src={product.image[0]} alt={product.name} className='w-full h-full object-contain p-1' />
                        : <FaGift className='m-auto mt-4 text-gray-300' size={24} />
                      }
                    </div>

                    {/* Details */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap mb-1'>
                        <span className='text-sm font-bold text-gray-800'>{gift.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <p className='text-xs text-gray-500 mb-1'>Gift: <span className='font-semibold text-gray-700'>{product?.name || '—'}</span></p>
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

                    {/* Actions */}
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

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6'>
            <div className='flex items-center justify-between mb-5'>
              <div className='flex items-center gap-2'>
                <FaGift className='text-rose-500' size={18} />
                <h2 className='text-lg font-bold text-gray-800'>{editGift ? 'Edit Free Gift Offer' : 'New Free Gift Offer'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition'>
                <FaTimes size={16} />
              </button>
            </div>

            <div className='space-y-4'>
              {/* Title */}
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

              {/* Product Search */}
              <div className='relative'>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>Gift Product <span className='text-red-400'>*</span></label>
                <input
                  type='text'
                  value={productSearch}
                  onChange={e => handleProductSearch(e.target.value)}
                  placeholder='Search product by name...'
                  className='w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'
                />
                {form.productId && (
                  <p className='text-[11px] text-green-600 mt-1 font-medium'>✓ Product selected</p>
                )}
                {searchLoading && (
                  <p className='text-xs text-gray-400 mt-1'>Searching...</p>
                )}
                {productResults.length > 0 && (
                  <div className='absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto'>
                    {productResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => selectProduct(p)}
                        className='w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition text-left'
                      >
                        {p.image?.[0] && <img src={p.image[0]} alt={p.name} className='w-8 h-8 rounded-lg object-contain bg-gray-50' />}
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-800 line-clamp-1'>{p.name}</p>
                          <p className='text-xs text-gray-400'>₹{p.price}</p>
                        </div>
                      </button>
                    ))}
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
                <p className='text-[11px] text-gray-400 mt-1'>Leave 0 to give gift on all orders regardless of cart value</p>
              </div>

              {/* Dates */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Start Date (optional)</label>
                  <input
                    type='date'
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className='w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>End Date (optional)</label>
                  <input
                    type='date'
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className='w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition'
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className='flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3'>
                <input
                  type='checkbox'
                  id='giftActive'
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className='w-4 h-4 accent-primary'
                />
                <label htmlFor='giftActive' className='text-sm font-medium text-gray-700 cursor-pointer'>
                  Active (visible to customers)
                </label>
              </div>

              {/* Buttons */}
              <div className='flex gap-3 pt-1'>
                <button
                  onClick={() => setShowModal(false)}
                  className='flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.productId}
                  className='flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {saving ? 'Saving...' : editGift ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminFreeGifts
