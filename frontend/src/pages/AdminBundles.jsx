import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaPlus, FaEdit, FaTrash, FaBoxOpen, FaTimes } from 'react-icons/fa'

const EMPTY_BUNDLE = {
  name: '', description: '', image: '', label: 'Bundle Deal',
  products: [{ productId: '', quantity: 1 }],
  discountType: 'percentage', discountValue: 10, active: true, displayOrder: 0
}

const AdminBundles = () => {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_BUNDLE)
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState({})
  const [searchResults, setSearchResults] = useState({})

  const fetchBundles = async () => {
    setLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.getBundles })
      if (res.data.success) setBundles(res.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchBundles() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_BUNDLE); setShowModal(true) }
  const openEdit = (bundle) => {
    setEditing(bundle._id)
    setForm({
      name: bundle.name, description: bundle.description || '', image: bundle.image || '',
      label: bundle.label || 'Bundle Deal',
      products: bundle.products.map(p => ({ productId: p.productId?._id || p.productId, quantity: p.quantity || 1 })),
      discountType: bundle.discountType, discountValue: bundle.discountValue,
      active: bundle.active, displayOrder: bundle.displayOrder || 0
    })
    setShowModal(true)
  }

  const searchProducts = async (idx, query) => {
    setProductSearch(prev => ({ ...prev, [idx]: query }))
    if (!query.trim()) { setSearchResults(prev => ({ ...prev, [idx]: [] })); return }
    try {
      const res = await Axios({ ...SummaryApi.searchProduct, data: { search: query, page: 1 } })
      if (res.data.success) setSearchResults(prev => ({ ...prev, [idx]: res.data.data || [] }))
    } catch {}
  }

  const setProductLine = (idx, productId, name) => {
    setForm(prev => {
      const products = [...prev.products]
      products[idx] = { ...products[idx], productId }
      return { ...prev, products }
    })
    setProductSearch(prev => ({ ...prev, [idx]: name }))
    setSearchResults(prev => ({ ...prev, [idx]: [] }))
  }

  const addProductLine = () => setForm(prev => ({ ...prev, products: [...prev.products, { productId: '', quantity: 1 }] }))
  const removeProductLine = (idx) => setForm(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }))
  const setQty = (idx, qty) => setForm(prev => {
    const products = [...prev.products]
    products[idx] = { ...products[idx], quantity: parseInt(qty) || 1 }
    return { ...prev, products }
  })

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Bundle name required'); return }
    const validProducts = form.products.filter(p => p.productId)
    if (!validProducts.length) { toast.error('Add at least one product'); return }
    setSaving(true)
    try {
      const payload = { ...form, products: validProducts }
      let res
      if (editing) {
        res = await Axios({ ...SummaryApi.updateBundle, url: `/api/bundle/${editing}`, method: 'put', data: payload })
      } else {
        res = await Axios({ ...SummaryApi.createBundle, data: payload })
      }
      if (res.data.success) {
        toast.success(editing ? 'Bundle updated!' : 'Bundle created!')
        setShowModal(false)
        fetchBundles()
      }
    } catch (e) { AxiosToastError(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bundle?')) return
    try {
      const res = await Axios({ ...SummaryApi.deleteBundle, url: `/api/bundle/${id}`, method: 'delete' })
      if (res.data.success) { toast.success('Bundle deleted'); fetchBundles() }
    } catch (e) { AxiosToastError(e) }
  }

  const toggleActive = async (bundle) => {
    try {
      await Axios({ url: `/api/bundle/${bundle._id}`, method: 'put', data: { active: !bundle.active } })
      fetchBundles()
    } catch {}
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <FaBoxOpen className='text-purple-500' size={26} />
            <h1 className='text-2xl font-bold text-gray-800'>Product Bundles</h1>
          </div>
          <button onClick={openCreate}
            className='btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2'>
            <FaPlus size={12} /> New Bundle
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin' />
          </div>
        ) : !bundles.length ? (
          <div className='text-center py-16 text-gray-400'>
            <FaBoxOpen size={48} className='mx-auto mb-3 opacity-30' />
            <p className='font-medium'>No bundles yet. Create one to get started!</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {bundles.map(bundle => {
              const originalTotal = bundle.products.reduce((acc, p) => acc + ((p.productId?.price || 0) * (p.quantity || 1)), 0)
              const discount = bundle.discountType === 'flat' ? bundle.discountValue : Math.round(originalTotal * bundle.discountValue / 100)
              const finalPrice = Math.max(0, originalTotal - discount)
              return (
                <div key={bundle._id} className={`bg-white rounded-2xl border shadow-sm p-4 transition ${!bundle.active ? 'opacity-60' : ''}`}>
                  <div className='flex items-start gap-4'>
                    {bundle.image && <img src={bundle.image} alt='' className='w-16 h-16 rounded-xl object-cover flex-shrink-0 border' />}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full'>{bundle.label}</span>
                        <h3 className='font-bold text-gray-800'>{bundle.name}</h3>
                        {!bundle.active && <span className='text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full'>Hidden</span>}
                      </div>
                      <p className='text-xs text-gray-500 mt-0.5'>{bundle.products.length} product{bundle.products.length > 1 ? 's' : ''}</p>
                      <div className='mt-1 flex items-center gap-2'>
                        {originalTotal > 0 && (
                          <>
                            <span className='text-sm font-black text-gray-800'>{DisplayPriceInRupees(finalPrice)}</span>
                            <span className='text-xs text-gray-400 line-through'>{DisplayPriceInRupees(originalTotal)}</span>
                            <span className='text-xs text-green-600 font-semibold'>
                              {bundle.discountType === 'flat' ? `₹${bundle.discountValue} off` : `${bundle.discountValue}% off`}
                            </span>
                          </>
                        )}
                      </div>
                      <div className='mt-1.5 flex flex-wrap gap-1'>
                        {bundle.products.map((p, i) => (
                          <span key={i} className='text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-lg'>
                            {p.productId?.name ? (p.productId.name.slice(0, 20) + (p.productId.name.length > 20 ? '…' : '')) : 'Unknown'} ×{p.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-2 flex-shrink-0'>
                      <div className='flex gap-2'>
                        <button onClick={() => toggleActive(bundle)}
                          className={`relative w-10 h-5 rounded-full transition ${bundle.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bundle.active ? 'translate-x-5' : ''}`} />
                        </button>
                        <button onClick={() => openEdit(bundle)} className='p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition'><FaEdit size={14} /></button>
                        <button onClick={() => handleDelete(bundle._id)} className='p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition'><FaTrash size={14} /></button>
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
      {showModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto'>
          <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl mt-8 mb-8'>
            <div className='flex items-center justify-between p-5 border-b'>
              <h3 className='font-bold text-lg'>{editing ? 'Edit Bundle' : 'New Bundle'}</h3>
              <button onClick={() => setShowModal(false)} className='p-1.5 hover:bg-gray-100 rounded-lg'><FaTimes /></button>
            </div>
            <div className='p-5 space-y-4 max-h-[70vh] overflow-y-auto'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='col-span-2'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Bundle Name *</label>
                  <input type='text' value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' placeholder='e.g. Festival Saree Combo' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Label</label>
                  <input type='text' value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' placeholder='Bundle Deal' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Image URL</label>
                  <input type='text' value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' placeholder='https://...' />
                </div>
                <div className='col-span-2'>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none' placeholder='Optional short description...' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Discount Type</label>
                  <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400'>
                    <option value='percentage'>Percentage (%)</option>
                    <option value='flat'>Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>
                    Discount Value ({form.discountType === 'flat' ? '₹' : '%'})
                  </label>
                  <input type='number' min='0' value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) || 0 }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 block mb-1'>Display Order</label>
                  <input type='number' min='0' value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' />
                </div>
                <div className='flex items-center gap-2 mt-5'>
                  <button onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                    className={`relative w-10 h-5 rounded-full transition ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className='text-sm font-medium text-gray-700'>Active (visible to customers)</span>
                </div>
              </div>

              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='text-xs font-semibold text-gray-600'>Products *</label>
                  <button onClick={addProductLine} className='text-xs text-purple-600 font-semibold flex items-center gap-1 hover:underline'>
                    <FaPlus size={9} /> Add product
                  </button>
                </div>
                <div className='space-y-2'>
                  {form.products.map((line, idx) => (
                    <div key={idx} className='flex gap-2 items-start'>
                      <div className='flex-1 relative'>
                        <input type='text'
                          value={productSearch[idx] !== undefined ? productSearch[idx] : (line.productId || '')}
                          onChange={e => searchProducts(idx, e.target.value)}
                          placeholder='Search product name...'
                          className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400' />
                        {searchResults[idx]?.length > 0 && (
                          <div className='absolute left-0 right-0 top-full z-10 bg-white border rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto'>
                            {searchResults[idx].map(p => (
                              <button key={p._id} onClick={() => setProductLine(idx, p._id, p.name)}
                                className='w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2'>
                                {p.image?.[0] && <img src={p.image[0]} className='w-7 h-7 rounded object-cover' alt='' />}
                                <span className='truncate'>{p.name}</span>
                                <span className='ml-auto text-xs text-gray-400 flex-shrink-0'>₹{p.price}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input type='number' min='1' value={line.quantity}
                        onChange={e => setQty(idx, e.target.value)}
                        className='w-14 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-purple-400' />
                      {form.products.length > 1 && (
                        <button onClick={() => removeProductLine(idx)} className='p-2 text-red-400 hover:bg-red-50 rounded-lg mt-0.5'><FaTimes size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='flex gap-3 p-5 border-t'>
              <button onClick={() => setShowModal(false)} className='flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50'>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className='flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2'>
                {saving && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />}
                {editing ? 'Save Changes' : 'Create Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBundles
