import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaRegUserCircle, FaCrown, FaMedal, FaShare, FaCopy } from "react-icons/fa"
import { MdAccountBalanceWallet } from 'react-icons/md'
import { GiDiamondTrophy } from 'react-icons/gi'
import { Link } from 'react-router-dom'
import UserProfileAvatarEdit from '../components/UserProfileAvatarEdit'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { setUserDetails } from '../store/userSlice'
import fetchUserDetails from '../utils/fetchUserDetails'
import BackButton from '../components/BackButton'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'

const TIER_CONFIG = {
    Gold: { color: '#f59e0b', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <FaCrown className='text-amber-500' size={18} /> },
    Silver: { color: '#64748b', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', icon: <FaMedal className='text-slate-400' size={18} /> },
    Bronze: { color: '#cd7c2f', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: <FaMedal className='text-orange-400' size={18} /> },
}

const Profile = () => {
    const user = useSelector(state => state.user)
    const [openProfileAvatarEdit, setProfileAvatarEdit] = useState(false)
    const [userData, setUserData] = useState({ name: user.name, email: user.email, mobile: user.mobile })
    const [loading, setLoading] = useState(false)
    const [loyalty, setLoyalty] = useState(null)
    const [referral, setReferral] = useState(null)
    const [walletBalance, setWalletBalance] = useState(null)
    const [pendingRewards, setPendingRewards] = useState(null)
    const dispatch = useDispatch()

    useEffect(() => {
        setUserData({ name: user.name, email: user.email, mobile: user.mobile })
    }, [user])

    useEffect(() => {
        if (!user?._id) return
        const fetchExtras = async () => {
            try {
                const [loyaltyRes, referralRes, walletRes, pendingRes] = await Promise.allSettled([
                    Axios({ ...SummaryApi.getMyLoyalty }),
                    Axios({ ...SummaryApi.getMyReferral }),
                    Axios({ ...SummaryApi.getWallet }),
                    Axios({ ...SummaryApi.getMyPendingLoyalty }),
                ])
                if (loyaltyRes.status === 'fulfilled' && loyaltyRes.value.data.success) setLoyalty(loyaltyRes.value.data.data)
                if (referralRes.status === 'fulfilled' && referralRes.value.data.success) setReferral(referralRes.value.data.data)
                if (walletRes.status === 'fulfilled' && walletRes.value.data.success) setWalletBalance(walletRes.value.data.data.balance || 0)
                if (pendingRes.status === 'fulfilled' && pendingRes.value.data.success) setPendingRewards(pendingRes.value.data.data)
            } catch {}
        }
        fetchExtras()
    }, [user?._id])

    const handleOnChange = (e) => {
        const { name, value } = e.target
        setUserData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const response = await Axios({ ...SummaryApi.updateUserDetails, data: userData })
            if (response.data.success) {
                toast.success(response.data.message)
                const ud = await fetchUserDetails()
                dispatch(setUserDetails(ud.data))
            }
        } catch (error) { AxiosToastError(error) }
        finally { setLoading(false) }
    }

    const copyReferral = () => {
        if (!referral?.referralCode) return
        const link = `${window.location.origin}/register?ref=${referral.referralCode}`
        navigator.clipboard.writeText(link)
        toast.success('Referral link copied!')
    }

    const tierCfg = loyalty ? TIER_CONFIG[loyalty.tier] : null

    return (
        <div className='p-4 max-w-md'>
            <BackButton className='mb-4' />

            {/* Avatar */}
            <div className='w-20 h-20 bg-red-500 flex items-center justify-center rounded-full overflow-hidden drop-shadow-sm'>
                {user.avatar
                    ? <img alt={user.name} src={user.avatar} className='w-full h-full' />
                    : <FaRegUserCircle size={65} />}
            </div>
            <button onClick={() => setProfileAvatarEdit(true)} className='text-sm min-w-20 border border-primary-100 hover:border-primary-200 hover:bg-primary-200 px-3 py-1 rounded-full mt-3'>Edit</button>
            {openProfileAvatarEdit && <UserProfileAvatarEdit close={() => setProfileAvatarEdit(false)} />}

            {/* Loyalty Tier */}
            {loyalty && tierCfg && (
                <div className={`mt-4 border rounded-xl p-4 ${tierCfg.bg}`}>
                    <div className='flex items-center gap-2 mb-1'>
                        {tierCfg.icon}
                        <span className={`font-bold text-sm ${tierCfg.text}`}>{loyalty.tier} Member</span>
                    </div>
                    <p className='text-xs text-gray-500'>Total spent: ₹{loyalty.totalSpent?.toLocaleString('en-IN')}</p>
                    {loyalty.next && (
                        <div className='mt-2'>
                            <div className='flex justify-between text-[10px] text-gray-400 mb-1'>
                                <span>{loyalty.tier}</span>
                                <span>{loyalty.next} at ₹{loyalty.nextAt?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-1.5'>
                                <div
                                    className='h-1.5 rounded-full transition-all'
                                    style={{
                                        width: `${Math.min(100, (loyalty.totalSpent / loyalty.nextAt) * 100)}%`,
                                        background: tierCfg.color
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Wallet & Rewards Summary */}
            {walletBalance !== null && (
                <div className='mt-3 border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4'>
                    <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                            <MdAccountBalanceWallet className='text-green-600' size={20} />
                            <span className='font-bold text-sm text-green-800'>My Wallet & Rewards</span>
                        </div>
                        <Link to='/dashboard/wallet' className='text-xs text-green-600 font-medium underline underline-offset-2'>View</Link>
                    </div>
                    <div className='flex gap-3'>
                        <div className='flex-1 bg-white rounded-lg p-3 border border-green-100 text-center'>
                            <p className='text-[10px] text-gray-500 mb-1'>Available Balance</p>
                            <p className='text-lg font-bold text-green-700'>{DisplayPriceInRupees(walletBalance)}</p>
                            <p className='text-[10px] text-gray-400'>Auto-applied at checkout</p>
                        </div>
                        <div className='flex-1 bg-white rounded-lg p-3 border border-amber-100 text-center'>
                            <p className='text-[10px] text-gray-500 mb-1'>Pending Rewards</p>
                            <p className='text-lg font-bold text-amber-600'>
                                {DisplayPriceInRupees(pendingRewards?.totalPendingValue || 0)}
                            </p>
                            <p className='text-[10px] text-gray-400'>
                                {pendingRewards?.orders?.length > 0
                                    ? `${pendingRewards.orders.length} order${pendingRewards.orders.length > 1 ? 's' : ''} processing`
                                    : 'No pending rewards'}
                            </p>
                        </div>
                    </div>
                    {pendingRewards?.orders?.length > 0 && (
                        <Link to='/dashboard/loyalty' className='mt-2 flex items-center justify-center gap-1.5 text-xs text-green-700 font-medium py-1.5'>
                            <GiDiamondTrophy size={12} />
                            View upcoming reward credits →
                        </Link>
                    )}
                </div>
            )}

            {/* Referral Card */}
            {referral?.referralCode && (
                <div className='mt-3 border border-blue-200 bg-blue-50 rounded-xl p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                        <FaShare className='text-blue-500' size={14} />
                        <span className='font-semibold text-sm text-blue-700'>Refer & Earn ₹100</span>
                    </div>
                    <p className='text-xs text-gray-500 mb-3'>Share your link with friends. When they place their first order, you get ₹100 wallet credit!</p>
                    <div className='flex items-center gap-2'>
                        <div className='flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate'>
                            {`${window.location.origin}/register?ref=${referral.referralCode}`}
                        </div>
                        <button onClick={copyReferral} className='flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700'>
                            <FaCopy size={11} /> Copy
                        </button>
                    </div>
                    {referral.referralCount > 0 && (
                        <p className='text-xs text-green-600 mt-2 font-medium'>✓ {referral.referralCount} friend{referral.referralCount !== 1 ? 's' : ''} joined using your link</p>
                    )}
                </div>
            )}

            {/* Profile Form */}
            <form className='my-4 grid gap-4' onSubmit={handleSubmit}>
                <div className='grid'>
                    <label>Name</label>
                    <input type='text' placeholder='Enter your name' className='p-2 bg-blue-50 outline-none border focus-within:border-primary-200 rounded' value={userData.name} name='name' onChange={handleOnChange} required />
                </div>
                <div className='grid'>
                    <label htmlFor='email'>Email</label>
                    <input type='email' id='email' placeholder='Enter your email' className='p-2 bg-blue-50 outline-none border focus-within:border-primary-200 rounded' value={userData.email} name='email' onChange={handleOnChange} required />
                </div>
                <div className='grid'>
                    <label htmlFor='mobile'>Mobile</label>
                    <input type='text' id='mobile' placeholder='Enter your mobile' className='p-2 bg-blue-50 outline-none border focus-within:border-primary-200 rounded' value={userData.mobile} name='mobile' onChange={handleOnChange} required />
                </div>
                <button className='border px-4 py-2 font-semibold hover:bg-primary-100 border-primary-100 text-primary-200 hover:text-neutral-800 rounded'>
                    {loading ? "Loading..." : "Submit"}
                </button>
            </form>
        </div>
    )
}

export default Profile
