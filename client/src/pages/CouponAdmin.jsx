import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
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

    useEffect(() => {
        fetchCoupons()
    }, [])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const openCreate = () => {
        setForm(emptyForm)
        setEditMode(false)
        setShowForm(true)
    }

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
        if (!form.code || !form.discountValue) {
            toast.error('Code and discount value are required')
            return
        }
        setSubmitting(true)
        try {
            const api = editMode ? SummaryApi.updateCoupon : SummaryApi.createCoupon
            const response = await Axios({ ...api, data: form })
            const { data: res } = response
            if (res.success) {
                toast.success(res.message)
                setShowForm(false)
                fetchCoupons()
            }
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
            if (res.success) {
                toast.success(res.message)
                setDeleteId(null)
                fetchCoupons()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handleToggleActive = async (coupon) => {
        try {
            const response = await Axios({
                ...SummaryApi.updateCoupon,
                data: { _id: coupon._id, isActive: !coupon.isActive }
            })
            const { data: res } = response
            if (res.success) {
                toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`)
                fetchCoupons()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section>
            {/* Header */}
            <div className='p-2 bg-white shadow-md flex items-center justify-between'>
                <h2 className='font-semibold'>Coupon Management</h2>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 text-sm border border-primary-200 hover:bg-primary-200 px-3 py-1 rounded bg-green-50 text-green-700'
                >
                    <FaPlus size={12} /> Add Coupon
                </button>
            </div>

            {loading && <Loading />}
            {!loading && coupons.length === 0 && <NoData />}

            {/* Coupon Table */}
            {!loading && coupons.length > 0 && (
                <div className='p-4 overflow-x-auto'>
                    <table className='w-full text-sm border-collapse'>
                        <thead>
                            <tr className='bg-gray-100 text-left'>
                                <th className='p-2 border'>Code</th>
                                <th className='p-2 border'>Type</th>
                                <th className='p-2 border'>Discount</th>
                                <th className='p-2 border'>Min Order</th>
                                <th className='p-2 border'>Max Discount</th>
                                <th className='p-2 border'>Expires</th>
                                <th className='p-2 border text-center'>Active</th>
                                <th className='p-2 border text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon._id} className='hover:bg-gray-50 border-b'>
                                    <td className='p-2 border font-mono font-semibold tracking-wide'>{coupon.code}</td>
                                    <td className='p-2 border capitalize'>{coupon.discountType}</td>
                                    <td className='p-2 border'>
                                        {coupon.discountType === 'percentage'
                                            ? `${coupon.discountValue}%`
                                            : `₹${coupon.discountValue}`}
                                    </td>
                                    <td className='p-2 border'>
                                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : '—'}
                                    </td>
                                    <td className='p-2 border'>
                                        {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : '—'}
                                    </td>
                                    <td className='p-2 border text-xs'>
                                        {coupon.expiresAt
                                            ? new Date(coupon.expiresAt).toLocaleDateString()
                                            : 'No expiry'}
                                    </td>
                                    <td className='p-2 border text-center'>
                                        <button
                                            onClick={() => handleToggleActive(coupon)}
                                            className='flex items-center justify-center w-full'
                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {coupon.isActive
                                                ? <FaCheckCircle className='text-green-500' size={18} />
                                                : <FaTimesCircle className='text-red-400' size={18} />}
                                        </button>
                                    </td>
                                    <td className='p-2 border'>
                                        <div className='flex gap-2 justify-center'>
                                            <button
                                                onClick={() => openEdit(coupon)}
                                                className='bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1'
                                            >
                                                <FaEdit size={11} /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(coupon._id)}
                                                className='bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded text-xs flex items-center gap-1'
                                            >
                                                <FaTrash size={11} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Form Modal */}
            {showForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-4 border-b'>
                            <h3 className='font-semibold text-lg'>{editMode ? 'Edit Coupon' : 'Create Coupon'}</h3>
                            <button onClick={() => setShowForm(false)} className='text-gray-500 hover:text-gray-800'>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
                            {/* Code */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>Coupon Code *</label>
                                <input
                                    name='code'
                                    value={form.code}
                                    onChange={handleChange}
                                    placeholder='e.g. SAVE20'
                                    className='w-full border rounded-lg px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:border-green-500'
                                    required
                                />
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>Discount Type *</label>
                                <select
                                    name='discountType'
                                    value={form.discountType}
                                    onChange={handleChange}
                                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                                >
                                    <option value='percentage'>Percentage (%)</option>
                                    <option value='flat'>Flat Amount (₹)</option>
                                </select>
                            </div>

                            {/* Discount Value */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>
                                    Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                </label>
                                <input
                                    name='discountValue'
                                    type='number'
                                    min='1'
                                    value={form.discountValue}
                                    onChange={handleChange}
                                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                                    required
                                />
                            </div>

                            {/* Min Order Amount */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>Minimum Order Amount (₹)</label>
                                <input
                                    name='minOrderAmount'
                                    type='number'
                                    min='0'
                                    value={form.minOrderAmount}
                                    onChange={handleChange}
                                    placeholder='0 = no minimum'
                                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                                />
                            </div>

                            {/* Max Discount (for percentage only) */}
                            {form.discountType === 'percentage' && (
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Max Discount Cap (₹)</label>
                                    <input
                                        name='maxDiscount'
                                        type='number'
                                        min='0'
                                        value={form.maxDiscount}
                                        onChange={handleChange}
                                        placeholder='Leave blank for no cap'
                                        className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                                    />
                                </div>
                            )}

                            {/* Expiry Date */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>Expiry Date (optional)</label>
                                <input
                                    name='expiresAt'
                                    type='date'
                                    value={form.expiresAt}
                                    onChange={handleChange}
                                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className='flex items-center gap-3'>
                                <input
                                    id='isActive'
                                    name='isActive'
                                    type='checkbox'
                                    checked={form.isActive}
                                    onChange={handleChange}
                                    className='w-4 h-4 accent-green-600'
                                />
                                <label htmlFor='isActive' className='text-sm font-medium'>Active (visible to users)</label>
                            </div>

                            <div className='flex gap-3 pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setShowForm(false)}
                                    className='flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-colors'
                                >
                                    {submitting ? 'Saving...' : editMode ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center'>
                        <p className='text-gray-800 font-semibold mb-1'>Delete Coupon?</p>
                        <p className='text-sm text-gray-500 mb-5'>This action cannot be undone.</p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setDeleteId(null)}
                                className='flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className='flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold'
                            >
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
