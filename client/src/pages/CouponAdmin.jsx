import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaTimesCircle, FaTag } from 'react-icons/fa'
import Loading from '../components/Loading'
import NoData from '../components/NoData'

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  isActive: true,
  expiresAt: '',
}

const CouponCard = ({ coupon, onEdit, onDelete, onToggle }) => {
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!coupon.isActive ? 'opacity-60' : ''}`}>
      {/* Card header */}
      <div className='flex items-center justify-between px-4 py-3 bg-gray-50 border-b'>
        <div className='flex items-center gap-2'>
          <FaTag className='text-primary-text' size={13} />
          <span className='font-bold font-mono tracking-widest text-gray-800 text-base'>{coupon.code}</span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => onToggle(coupon)}
            title={coupon.isActive ? 'Deactivate' : 'Activate'}
          >
            {coupon.isActive
              ? <FaCheckCircle className='text-green-500' size={20} />
              : <FaTimesCircle className='text-red-400' size={20} />}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className='px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Type</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${coupon.discountType === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
            {coupon.discountType === 'percentage' ? 'Percentage' : 'Flat'}
          </span>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Discount</p>
          <p className='font-bold text-gray-800'>
            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
          </p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Min Order</p>
          <p className='text-gray-600'>{coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : '—'}</p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Max Discount</p>
          <p className='text-gray-600'>{coupon.maxDiscount ? `₹${coupon.maxDiscount}` : '—'}</p>
        </div>
        <div className='col-span-2'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>Expires</p>
          <p className={`text-xs ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
            {coupon.expiresAt ? `${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}${isExpired ? ' — Expired' : ''}` : 'No expiry'}
          </p>
        </div>
      </div>

      {/* Card actions */}
      <div className='flex gap-2 px-4 pb-3'>
        <button
          onClick={() => onEdit(coupon)}
          className='flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-semibold transition-colors'
        >
          <FaEdit size={12} /> Edit
        </button>
        <button
          onClick={() => onDelete(coupon._id)}
          className='flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-semibold transition-colors'
        >
          <FaTrash size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

const CouponAdmin = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const response = await Axios({ ...SummaryApi.getAllCoupons })
      const { data: res } = response
      if (res.success) setCoupons(res.data)
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const openCreate = () => { setForm(emptyForm); setEditMode(false); setShowForm(true) }

  const openEdit = (coupon) => {
    setForm({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    })
    setEditMode(true)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code || !form.discountValue) { toast.error('Code and discount value are required'); return }
    setSubmitting(true)
    try {
      const api = editMode ? SummaryApi.updateCoupon : SummaryApi.createCoupon
      const response = await Axios({ ...api, data: form })
      const { data: res } = response
      if (res.success) { toast.success(res.message); setShowForm(false); fetchCoupons() }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await Axios({ ...SummaryApi.deleteCoupon, data: { _id: id } })
      const { data: res } = response
      if (res.success) { toast.success(res.message); setDeleteId(null); fetchCoupons() }
    } catch (error) { AxiosToastError(error) }
  }

  const handleToggleActive = async (coupon) => {
    try {
      const response = await Axios({ ...SummaryApi.updateCoupon, data: { _id: coupon._id, isActive: !coupon.isActive } })
      const { data: res } = response
      if (res.success) { toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`); fetchCoupons() }
    } catch (error) { AxiosToastError(error) }
  }

  return (
    <section>
      {/* Page header */}
      <div className='p-3 sm:p-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-10 border-b'>
        <h2 className='font-bold text-gray-800 text-base'>Coupon Management</h2>
        <button
          onClick={openCreate}
          className='btn-primary flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-semibold'
        >
          <FaPlus size={12} /> Add Coupon
        </button>
      </div>

      {loading && <Loading />}
      {!loading && coupons.length === 0 && <NoData />}

      {!loading && coupons.length > 0 && (
        <>
          {/* ── Mobile & Tablet: Card Grid ── */}
          <div className='block lg:hidden p-3 grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {coupons.map(coupon => (
              <CouponCard
                key={coupon._id}
                coupon={coupon}
                onEdit={openEdit}
                onDelete={setDeleteId}
                onToggle={handleToggleActive}
              />
            ))}
          </div>

          {/* ── Desktop: Table ── */}
          <div className='hidden lg:block p-4 overflow-x-auto'>
            <table className='w-full text-sm border-collapse'>
              <thead>
                <tr className='bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-500'>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Code</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Type</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Discount</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Min Order</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Max Cap</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200'>Expires</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200 text-center'>Active</th>
                  <th className='px-3 py-3 border-b-2 border-gray-200 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                  return (
                    <tr key={coupon._id} className={`border-b hover:bg-gray-50 ${!coupon.isActive ? 'opacity-60' : ''}`}>
                      <td className='px-3 py-3 font-mono font-bold tracking-wider text-gray-800'>{coupon.code}</td>
                      <td className='px-3 py-3'>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${coupon.discountType === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {coupon.discountType === 'percentage' ? 'Percentage' : 'Flat'}
                        </span>
                      </td>
                      <td className='px-3 py-3 font-semibold'>
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </td>
                      <td className='px-3 py-3 text-gray-600'>{coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : '—'}</td>
                      <td className='px-3 py-3 text-gray-600'>{coupon.maxDiscount ? `₹${coupon.maxDiscount}` : '—'}</td>
                      <td className={`px-3 py-3 text-xs ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                        {coupon.expiresAt ? `${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}${isExpired ? ' ⚠' : ''}` : 'No expiry'}
                      </td>
                      <td className='px-3 py-3 text-center'>
                        <button onClick={() => handleToggleActive(coupon)} title={coupon.isActive ? 'Deactivate' : 'Activate'} className='inline-flex'>
                          {coupon.isActive
                            ? <FaCheckCircle className='text-green-500' size={18} />
                            : <FaTimesCircle className='text-red-400' size={18} />}
                        </button>
                      </td>
                      <td className='px-3 py-3'>
                        <div className='flex gap-2 justify-center'>
                          <button onClick={() => openEdit(coupon)} className='bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1'>
                            <FaEdit size={11} /> Edit
                          </button>
                          <button onClick={() => setDeleteId(coupon._id)} className='bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1'>
                            <FaTrash size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10'>
              <h3 className='font-bold text-gray-800'>{editMode ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => setShowForm(false)} className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500'>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='p-4 space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Coupon Code *</label>
                <input
                  name='code' value={form.code} onChange={handleChange}
                  placeholder='e.g. SAVE20'
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Discount Type *</label>
                <select
                  name='discountType' value={form.discountType} onChange={handleChange}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                >
                  <option value='percentage'>Percentage (%)</option>
                  <option value='flat'>Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>
                  Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  name='discountValue' type='number' min='1' value={form.discountValue} onChange={handleChange}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  required
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1'>Min Order (₹)</label>
                  <input
                    name='minOrderAmount' type='number' min='0' value={form.minOrderAmount} onChange={handleChange}
                    placeholder='0 = no min'
                    className='w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  />
                </div>
                {form.discountType === 'percentage' && (
                  <div>
                    <label className='block text-xs font-semibold text-gray-600 mb-1'>Max Cap (₹)</label>
                    <input
                      name='maxDiscount' type='number' min='0' value={form.maxDiscount} onChange={handleChange}
                      placeholder='No cap'
                      className='w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    />
                  </div>
                )}
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Expiry Date (optional)</label>
                <input
                  name='expiresAt' type='date' value={form.expiresAt} onChange={handleChange}
                  className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                />
              </div>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                <input id='isActive' name='isActive' type='checkbox' checked={form.isActive} onChange={handleChange} className='w-4 h-4 accent-green-600' />
                <label htmlFor='isActive' className='text-sm font-medium text-gray-700'>Active (visible to customers)</label>
              </div>
              <div className='flex gap-3 pt-1'>
                <button type='button' onClick={() => setShowForm(false)} className='flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50'>
                  Cancel
                </button>
                <button type='submit' disabled={submitting} className='flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-50'>
                  {submitting ? 'Saving...' : editMode ? 'Update' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 w-full sm:max-w-sm text-center'>
            <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <FaTrash className='text-red-500' size={18} />
            </div>
            <p className='text-gray-800 font-bold mb-1'>Delete Coupon?</p>
            <p className='text-sm text-gray-500 mb-5'>This action cannot be undone.</p>
            <div className='flex gap-3'>
              <button onClick={() => setDeleteId(null)} className='flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50'>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className='flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CouponAdmin
