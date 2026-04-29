import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import BackButton from '../components/BackButton'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import { FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi'
import { MdAccountBalanceWallet } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { FaGift, FaUndoAlt, FaShoppingBag } from 'react-icons/fa'

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : ''

const txIcon = (desc = '') => {
    if (desc.toLowerCase().includes('refund')) return <FaUndoAlt size={12} className='text-green-600' />
    if (desc.toLowerCase().includes('order') || desc.toLowerCase().includes('payment')) return <FaShoppingBag size={12} className='text-red-500' />
    return <FaGift size={12} className='text-blue-500' />
}

const Wallet = () => {
  const siteName = useSelector(state => state.site.name)
    const [wallet, setWallet] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true)
                const res = await Axios({ ...SummaryApi.getWallet })
                if (res.data.success) setWallet(res.data.data)
            } catch {
                toast.error('Failed to load wallet')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const transactions = wallet?.transactions || []
    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
    const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='max-w-2xl mx-auto px-6 pt-4'>
                <BackButton />
            </div>
            {/* Header */}
            <div className='bg-gradient-to-br from-green-600 to-emerald-700 text-white'>
                <div className='max-w-2xl mx-auto p-6'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                            <MdAccountBalanceWallet size={22} className='text-white' />
                        </div>
                        <div>
                            <p className='text-green-100 text-xs font-medium'>My Wallet</p>
                            <h1 className='font-bold text-xl'>{siteName} Wallet</h1>
                        </div>
                    </div>

                    {loading ? (
                        <div className='bg-white/10 rounded-2xl p-6 animate-pulse h-32'></div>
                    ) : (
                        <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20'>
                            <p className='text-green-100 text-xs font-medium uppercase tracking-widest mb-1'>Available Balance</p>
                            <p className='text-4xl font-bold mb-4'>{DisplayPriceInRupees(wallet?.balance || 0)}</p>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='bg-white/10 rounded-xl p-3'>
                                    <div className='flex items-center gap-1.5 mb-1'>
                                        <FiArrowDownLeft size={14} className='text-green-300' />
                                        <span className='text-[11px] text-green-200 font-semibold uppercase tracking-wide'>Total Credited</span>
                                    </div>
                                    <p className='font-bold text-lg'>{DisplayPriceInRupees(totalCredit)}</p>
                                </div>
                                <div className='bg-white/10 rounded-xl p-3'>
                                    <div className='flex items-center gap-1.5 mb-1'>
                                        <FiArrowUpRight size={14} className='text-red-300' />
                                        <span className='text-[11px] text-red-200 font-semibold uppercase tracking-wide'>Total Used</span>
                                    </div>
                                    <p className='font-bold text-lg'>{DisplayPriceInRupees(totalDebit)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions */}
            <div className='max-w-2xl mx-auto p-4'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='font-bold text-gray-800'>Transaction History</h2>
                    <div className='flex gap-1'>
                        {['all', 'credit', 'debit'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                                    filter === f
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white border text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className='space-y-2'>
                        {[1,2,3,4].map(i => (
                            <div key={i} className='bg-white rounded-xl p-4 animate-pulse h-16'></div>
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                        <MdAccountBalanceWallet size={40} className='mb-3 text-gray-200' />
                        <p className='font-medium text-sm'>No transactions yet</p>
                        <p className='text-xs mt-1'>Your wallet activity will appear here</p>
                    </div>
                )}

                <div className='space-y-2'>
                    {filtered.map((tx, i) => (
                        <div key={i} className='bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3'>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                                {tx.type === 'credit'
                                    ? <FiArrowDownLeft size={18} className='text-green-600' />
                                    : <FiArrowUpRight size={18} className='text-red-500' />
                                }
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold text-gray-800 line-clamp-1'>{tx.description || (tx.type === 'credit' ? 'Wallet Credit' : 'Wallet Debit')}</p>
                                <p className='text-[11px] text-gray-400 mt-0.5'>{formatDate(tx.createdAt)}</p>
                                {tx.reference && (
                                    <p className='text-[10px] text-gray-300 font-mono mt-0.5'>{tx.reference}</p>
                                )}
                            </div>
                            <div className='text-right flex-shrink-0'>
                                <p className={`font-bold text-base ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}{DisplayPriceInRupees(tx.amount)}
                                </p>
                                <p className='text-[10px] text-gray-300'>Bal: {DisplayPriceInRupees(tx.balanceAfter)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Wallet
