import React, { useState } from 'react'
import staticLogo from '../assets/logo.png'
import Search from './Search'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaRegCircleUser } from "react-icons/fa6"
import useMobile from '../hooks/useMobile'
import { BsCart4 } from "react-icons/bs"
import { useSelector } from 'react-redux'
import { GoTriangleDown, GoTriangleUp } from "react-icons/go"
import UserMenu from './UserMenu'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { useGlobalContext } from '../provider/GlobalProvider'
import DisplayCartItem from './DisplayCartItem'
import NotificationBell from './NotificationBell'

const Header = () => {
    const [isMobile] = useMobile()
    const location = useLocation()
    const isSearchPage = location.pathname === "/search"
    const navigate = useNavigate()
    const user = useSelector((state) => state?.user)
    const [openUserMenu, setOpenUserMenu] = useState(false)
    const cartItem = useSelector(state => state.cartItem.cart)
    const { totalPrice, totalQty } = useGlobalContext()
    const [openCartSection, setOpenCartSection] = useState(false)
    const logoUrl = useSelector(state => state.site.logoUrl)
    const siteName = useSelector(state => state.site.name)
    const announcement = useSelector(state => state.site.announcement)
    const announcementEnabled = useSelector(state => state.site.announcementEnabled)

    // Brand: show custom logo, or text name, or fallback static logo
    const showLogo = !!logoUrl
    const showTextName = !logoUrl && !!siteName
    const logoSrc = logoUrl || staticLogo

    const handleMobileUser = () => {
        if (!user._id) { navigate("/login"); return }
        navigate("/user")
    }

    const annText = announcement || 'Free delivery above ₹999'

    return (
        <header className='sticky top-0 z-40 flex flex-col bg-white shadow-sm'>

            {/* ── Announcement Marquee Bar ── */}
            {announcementEnabled && annText && (
                <div className='bg-primary overflow-hidden py-1.5 cursor-default'>
                    <div className='announcement-ticker'>
                        {[...Array(6)].map((_, i) => (
                            <span key={i} className='text-white text-xs font-semibold px-10'>
                                ★&nbsp; {annText}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════ MOBILE HEADER ════════════ */}
            <div className='lg:hidden'>
                {/* Row 1: Logo + Icons */}
                {!isSearchPage && (
                    <div className='flex items-center justify-between px-3 pt-2.5 pb-1'>
                        {/* Logo */}
                        <Link to="/" className='flex items-center gap-2'>
                            {showLogo && (
                                <img
                                    src={logoSrc}
                                    alt={siteName}
                                    className='object-contain'
                                    style={{ height: '38px', width: 'auto', maxWidth: '130px' }}
                                />
                            )}
                            {showTextName && (
                                <span className='font-black text-xl tracking-tight' style={{ color: 'var(--primary, #16a34a)' }}>
                                    {siteName}
                                </span>
                            )}
                            {!showLogo && !showTextName && (
                                <img
                                    src={logoSrc}
                                    alt='Store'
                                    className='object-contain'
                                    style={{ height: '38px', width: 'auto', maxWidth: '130px' }}
                                />
                            )}
                        </Link>
                        {/* Right icons */}
                        <div className='flex items-center gap-2'>
                            {user?._id && (
                                <div className='flex items-center justify-center'>
                                    <NotificationBell />
                                </div>
                            )}
                            <button
                                onClick={handleMobileUser}
                                className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors'
                            >
                                <FaRegCircleUser size={19} />
                            </button>
                        </div>
                    </div>
                )}
                {/* Row 2: Search bar */}
                <div className='px-3 pb-2.5'>
                    <Search />
                </div>
            </div>

            {/* ════════════ DESKTOP HEADER ════════════ */}
            <div className='hidden lg:flex items-center h-16 container mx-auto px-4 gap-6'>
                {/* Logo */}
                <Link to="/" className='flex-shrink-0 flex items-center gap-2'>
                    {showLogo && (
                        <img
                            src={logoSrc}
                            alt={siteName}
                            className='object-contain'
                            style={{ height: '48px', width: 'auto', maxWidth: '170px' }}
                        />
                    )}
                    {showTextName && (
                        <span className='font-black text-2xl tracking-tight' style={{ color: 'var(--primary, #16a34a)' }}>
                            {siteName}
                        </span>
                    )}
                    {!showLogo && !showTextName && (
                        <img
                            src={logoSrc}
                            alt='Store'
                            className='object-contain'
                            style={{ height: '48px', width: 'auto', maxWidth: '170px' }}
                        />
                    )}
                </Link>

                {/* Search — takes remaining space */}
                <div className='flex-1 max-w-xl'>
                    <Search />
                </div>

                {/* Right actions */}
                <div className='flex items-center gap-6 flex-shrink-0'>
                    {user?._id && <NotificationBell />}
                    {user?._id ? (
                        <div className='relative'>
                            <div
                                onClick={() => setOpenUserMenu(prev => !prev)}
                                className='flex select-none items-center gap-1 cursor-pointer'
                            >
                                <p>Account</p>
                                {openUserMenu ? <GoTriangleUp size={22} /> : <GoTriangleDown size={22} />}
                            </div>
                            {openUserMenu && (
                                <div className='absolute right-0 top-12 z-50'>
                                    <div className='bg-white rounded-xl p-4 min-w-52 shadow-xl border'>
                                        <UserMenu close={() => setOpenUserMenu(false)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className='text-base font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors'
                        >
                            Login
                        </button>
                    )}
                    <button
                        onClick={() => setOpenCartSection(true)}
                        className='btn-primary flex items-center gap-2 px-4 py-2 rounded-xl'
                    >
                        <BsCart4 size={22} className='animate-bounce' />
                        <div className='font-semibold text-sm leading-tight'>
                            {cartItem[0] ? (
                                <>
                                    <p>{totalQty} Items</p>
                                    <p>{DisplayPriceInRupees(totalPrice)}</p>
                                </>
                            ) : (
                                <p>My Cart</p>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {openCartSection && (
                <DisplayCartItem close={() => setOpenCartSection(false)} />
            )}
        </header>
    )
}

export default Header
