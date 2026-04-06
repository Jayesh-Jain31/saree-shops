import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaBoxOpen, FaUndoAlt, FaChevronRight } from 'react-icons/fa'
import { MdPending, MdDone, MdClose, MdLocalAtm } from 'react-icons/md'
import NoData from '../components/NoData'
import toast from 'react-hot-toast'

const statusConfig = {
    'Pending':          { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <MdPending size={12} /> },
    'Approved':         { color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <MdDone size={12} /> },
    'Rejected':         { color: 'bg-red-50 text-red-700 border-red-200',          icon: <MdClose size={12} /> },
    'Refund Initiated': { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <MdLocalAtm size={12} /> },
    'Refunded':         { color: 'bg-green-50 text-green-700 border-green-200',    icon: <MdDone size={12} /> },
}

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig['Pending']
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
            {cfg.icon} {status}
        </span>
    )
}

const MyReturns = () => {
    const [returns, setReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true)
                const res = await Axios({ ...SummaryApi.getMyReturns })
                if (res.data.success) setReturns(res.data.data)
            } catch (e) {
                toast.error('Failed to load returns')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='bg-white border-b sticky top-0 z-10'>
                <div className='p-4 max-w-3xl mx-auto flex items-center gap-3'>
                    <div className='w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center'>
                        <FaUndoAlt className='text-orange-600' size={16} />
                    </div>
                    <div>
                        <h1 className='font-bold text-xl text-gray-800'>My Returns</h1>
                        <p className='text-xs text-gray-500'>{returns.length} return request{returns.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            <div className='max-w-3xl mx-auto p-4'>
                {loading && (
                    <div className='flex justify-center py-16'>
                        <div className='w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin'></div>
                    </div>
                )}

                {!loading && returns.length === 0 && (
                    <div className='mt-8'>
                        <NoData />
                        <div className='text-center mt-4'>
                            <p className='text-gray-500 text-sm mb-3'>No return requests yet</p>
                            <button
                                onClick={() => navigate('/dashboard/myorders')}
                                className='bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700'
                            >
                                View My Orders
                            </button>
                        </div>
                    </div>
                )}

                <div className='space-y-3'>
                    {returns.map(ret => {
                        const preview = ret.items?.[0]?.product_details?.image?.[0]
                        const firstName = ret.items?.[0]?.product_details?.name || 'Item'
                        return (
                            <div
                                key={ret._id}
                                onClick={() => navigate(`/dashboard/order/${ret.orderId}`)}
                                className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer p-4'
                            >
                                <div className='flex items-start gap-3'>
                                    {preview && (
                                        <div className='w-16 h-16 rounded-lg border bg-gray-50 p-1 flex-shrink-0'>
                                            <img src={preview} className='w-full h-full object-contain' alt='' />
                                        </div>
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <p className='font-semibold text-gray-800 text-sm line-clamp-1'>
                                                {ret.items?.length === 1 ? firstName : `${firstName} + ${ret.items.length - 1} more`}
                                            </p>
                                            <FaChevronRight className='text-gray-300 flex-shrink-0 mt-0.5' size={11} />
                                        </div>
                                        <p className='text-[11px] text-gray-400 mt-0.5'>Order: {ret.orderDisplayId}</p>
                                        <p className='text-xs text-gray-500 mt-1 italic'>"{ret.reason}"</p>
                                        <div className='flex items-center gap-2 mt-2'>
                                            <StatusBadge status={ret.status} />
                                            <span className='text-[11px] text-gray-400'>{formatDate(ret.createdAt)}</span>
                                        </div>
                                        {ret.adminNote && (
                                            <p className='text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2 border border-gray-100'>
                                                <span className='font-semibold'>Note:</span> {ret.adminNote}
                                            </p>
                                        )}
                                        {ret.status === 'Refunded' && ret.refundAmount > 0 && (
                                            <p className='text-xs font-semibold text-green-700 mt-1'>
                                                Refunded: {DisplayPriceInRupees(ret.refundAmount)}
                                            </p>
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

export default MyReturns
