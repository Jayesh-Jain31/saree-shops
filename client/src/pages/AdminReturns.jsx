import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import { FaUndoAlt, FaSearch, FaFilter } from 'react-icons/fa'
import { MdPending, MdDone, MdClose, MdLocalAtm, MdCheck } from 'react-icons/md'

const statusConfig = {
    'Pending':          { color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'Approved':         { color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'Rejected':         { color: 'bg-red-50 text-red-700 border-red-200' },
    'Refund Initiated': { color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'Refunded':         { color: 'bg-green-50 text-green-700 border-green-200' },
}

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Refund Initiated', 'Refunded']

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig['Pending']
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
            {status}
        </span>
    )
}

const AdminReturns = () => {
    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')
    const [search, setSearch] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ status: '', adminNote: '', refundAmount: '' })
    const [saving, setSaving] = useState(false)

    const fetchReturns = async (status = 'all') => {
        try {
            setLoading(true)
            const res = await Axios({
                ...SummaryApi.getAllReturnsAdmin,
                params: { status, limit: 100 }
            })
            if (res.data.success) setReturns(res.data.data)
        } catch {
            toast.error('Failed to load return requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchReturns(filterStatus) }, [filterStatus])

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

    const openEdit = (ret) => {
        setEditingId(ret._id)
        setEditForm({ status: ret.status, adminNote: ret.adminNote || '', refundAmount: ret.refundAmount || '' })
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const res = await Axios({
                ...SummaryApi.updateReturnStatus,
                url: `${SummaryApi.updateReturnStatus.url}/${editingId}`,
                data: {
                    status: editForm.status,
                    adminNote: editForm.adminNote,
                    refundAmount: parseFloat(editForm.refundAmount) || 0
                }
            })
            if (res.data.success) {
                toast.success('Return request updated')
                setReturns(prev => prev.map(r => r._id === editingId ? res.data.data : r))
                setEditingId(null)
            }
        } catch {
            toast.error('Failed to update return request')
        } finally {
            setSaving(false)
        }
    }

    const filtered = returns.filter(r => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            r.orderDisplayId?.toLowerCase().includes(q) ||
            r.userId?.name?.toLowerCase().includes(q) ||
            r.userId?.email?.toLowerCase().includes(q) ||
            r.reason?.toLowerCase().includes(q)
        )
    })

    const stats = {
        total: returns.length,
        pending: returns.filter(r => r.status === 'Pending').length,
        approved: returns.filter(r => r.status === 'Approved').length,
        refunded: returns.filter(r => r.status === 'Refunded').length,
    }

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='bg-white border-b sticky top-0 z-10'>
                <div className='p-4 max-w-5xl mx-auto'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center'>
                            <FaUndoAlt className='text-orange-600' size={16} />
                        </div>
                        <div>
                            <h1 className='font-bold text-xl text-gray-800'>Return Requests</h1>
                            <p className='text-xs text-gray-500'>{returns.length} total requests</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-4 gap-2 mb-4'>
                        {[
                            { label: 'Total', val: stats.total, color: 'blue' },
                            { label: 'Pending', val: stats.pending, color: 'yellow' },
                            { label: 'Approved', val: stats.approved, color: 'indigo' },
                            { label: 'Refunded', val: stats.refunded, color: 'green' },
                        ].map(s => (
                            <div key={s.label} className={`bg-${s.color}-50 rounded-xl p-2.5 text-center`}>
                                <p className={`text-[9px] text-${s.color}-400 uppercase tracking-wider font-bold`}>{s.label}</p>
                                <p className={`text-lg font-bold text-${s.color}-700`}>{s.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className='flex flex-col sm:flex-row gap-2'>
                        <div className='relative flex-1'>
                            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder='Search by order ID, customer, reason...'
                                className='w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-gray-50'
                            />
                        </div>
                        <div className='relative'>
                            <FaFilter className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400' size={10} />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className='pl-7 pr-4 py-2 border rounded-lg text-xs focus:outline-none focus:border-orange-400 bg-gray-50 appearance-none cursor-pointer'
                            >
                                <option value='all'>All Status</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className='max-w-5xl mx-auto p-4'>
                {loading && (
                    <div className='flex justify-center py-16'>
                        <div className='w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin'></div>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                        <FaUndoAlt size={32} className='mb-3' />
                        <p className='font-medium text-sm'>No return requests found</p>
                    </div>
                )}

                <div className='space-y-3'>
                    {filtered.map(ret => {
                        const isEditing = editingId === ret._id
                        const preview = ret.items?.[0]?.product_details?.image?.[0]
                        const firstName = ret.items?.[0]?.product_details?.name || 'Item'

                        return (
                            <div key={ret._id} className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
                                <div className='flex items-start gap-3'>
                                    {preview && (
                                        <div className='w-16 h-16 rounded-lg border bg-gray-50 p-1 flex-shrink-0'>
                                            <img src={preview} className='w-full h-full object-contain' alt='' />
                                        </div>
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div>
                                                <p className='font-semibold text-gray-800 text-sm'>
                                                    {ret.items?.length === 1 ? firstName : `${firstName} + ${ret.items.length - 1} more`}
                                                </p>
                                                <p className='text-[11px] font-mono text-gray-400 mt-0.5'>{ret.orderDisplayId}</p>
                                            </div>
                                            <StatusBadge status={ret.status} />
                                        </div>

                                        <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500'>
                                            <span><strong>Customer:</strong> {ret.userId?.name || ret.userId?.email || 'N/A'}</span>
                                            <span><strong>Date:</strong> {formatDate(ret.createdAt)}</span>
                                            <span><strong>Order Total:</strong> {DisplayPriceInRupees(ret.totalAmt)}</span>
                                        </div>

                                        <p className='text-xs text-gray-600 mt-1.5'>
                                            <strong>Reason:</strong> {ret.reason}
                                        </p>
                                        {ret.description && (
                                            <p className='text-xs text-gray-500 mt-0.5 italic'>"{ret.description}"</p>
                                        )}

                                        {ret.adminNote && !isEditing && (
                                            <p className='text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2 border border-gray-100'>
                                                <strong>Admin Note:</strong> {ret.adminNote}
                                            </p>
                                        )}
                                        {ret.refundAmount > 0 && !isEditing && (
                                            <p className='text-xs text-green-700 font-semibold mt-1'>Refund: {DisplayPriceInRupees(ret.refundAmount)}</p>
                                        )}

                                        {isEditing ? (
                                            <div className='mt-3 space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-100'>
                                                <div>
                                                    <label className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Status</label>
                                                    <select
                                                        value={editForm.status}
                                                        onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                                                        className='w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white'
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Refund Amount</label>
                                                    <input
                                                        type='number'
                                                        value={editForm.refundAmount}
                                                        onChange={e => setEditForm(p => ({ ...p, refundAmount: e.target.value }))}
                                                        placeholder={`Max: ${ret.totalAmt}`}
                                                        className='w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white'
                                                    />
                                                </div>
                                                <div>
                                                    <label className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>Note to Customer</label>
                                                    <textarea
                                                        value={editForm.adminNote}
                                                        onChange={e => setEditForm(p => ({ ...p, adminNote: e.target.value }))}
                                                        rows={2}
                                                        placeholder='Optional note visible to customer...'
                                                        className='w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white resize-none'
                                                    />
                                                </div>
                                                <div className='flex gap-2'>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className='flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100'
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className='flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1'
                                                    >
                                                        {saving ? 'Saving...' : <><MdCheck size={14} /> Save</>}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => openEdit(ret)}
                                                className='mt-3 px-4 py-1.5 border border-orange-200 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-50 transition-colors'
                                            >
                                                Update Status
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default AdminReturns
