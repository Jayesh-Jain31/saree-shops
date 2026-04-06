import React, { useEffect, useState } from 'react'
import staticLogo from '../assets/logo.png'
import Search from './Search'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaRegCircleUser } from "react-icons/fa6";
import useMobile from '../hooks/useMobile';
import { BsCart4 } from "react-icons/bs";
import { useSelector } from 'react-redux';
import { GoTriangleDown, GoTriangleUp } from "react-icons/go";
import UserMenu from './UserMenu';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { useGlobalContext } from '../provider/GlobalProvider';
import DisplayCartItem from './DisplayCartItem'
import NotificationBell from './NotificationBell';

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

    const logoSrc = logoUrl || staticLogo

    const redirectToLoginPage = () => {
        navigate("/login")
    }

    const handleCloseUserMenu = () => {
        setOpenUserMenu(false)
    }

    const handleMobileUser = () => {
        if (!user._id) {
            navigate("/login")
            return
        }
        navigate("/user")
    }

    const annText = announcement || 'Free delivery above ₹999'

    return (
        <header className='sticky top-0 z-40 flex flex-col bg-white lg:shadow-md'>

            {/* ── Announcement / Marquee Bar ── */}
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

            {/* ── Main Header Row ── */}
            <div className='h-16 lg:h-16 flex flex-col justify-center gap-1'>
            {!(isSearchPage && isMobile) && (
                <div className='container mx-auto flex items-center px-2 justify-between'>
                    <div className='h-full'>
                        <Link to={"/"} className='h-full flex justify-center items-center'>
                            <img
                                src={logoSrc}
                                width={170}
                                height={60}
                                alt={siteName}
                                className='hidden lg:block object-contain'
                                style={{ maxHeight: '56px', width: 'auto', maxWidth: '170px' }}
                            />
                            <img
                                src={logoSrc}
                                width={120}
                                height={60}
                                alt={siteName}
                                className='lg:hidden object-contain'
                                style={{ maxHeight: '44px', width: 'auto', maxWidth: '120px' }}
                            />
                        </Link>
                    </div>

                    <div className='hidden lg:block'>
                        <Search />
                    </div>

                    <div className=''>
                        <button className='text-neutral-600 lg:hidden' onClick={handleMobileUser}>
                            <FaRegCircleUser size={26} />
                        </button>

                        <div className='hidden lg:flex items-center gap-10'>
                            {user?._id && <NotificationBell />}
                            {user?._id ? (
                                <div className='relative'>
                                    <div onClick={() => setOpenUserMenu(preve => !preve)} className='flex select-none items-center gap-1 cursor-pointer'>
                                        <p>Account</p>
                                        {openUserMenu ? <GoTriangleUp size={25} /> : <GoTriangleDown size={25} />}
                                    </div>
                                    {openUserMenu && (
                                        <div className='absolute right-0 top-12'>
                                            <div className='bg-white rounded p-4 min-w-52 lg:shadow-lg'>
                                                <UserMenu close={handleCloseUserMenu} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={redirectToLoginPage} className='text-lg px-2'>Login</button>
                            )}
                            <button onClick={() => setOpenCartSection(true)} className='btn-primary flex items-center gap-2 px-3 py-2 rounded-lg'>
                                <div className='animate-bounce'>
                                    <BsCart4 size={26} />
                                </div>
                                <div className='font-semibold text-sm'>
                                    {cartItem[0] ? (
                                        <div>
                                            <p>{totalQty} Items</p>
                                            <p>{DisplayPriceInRupees(totalPrice)}</p>
                                        </div>
                                    ) : (
                                        <p>My Cart</p>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='container mx-auto px-2 lg:hidden'>
                <Search />
            </div>
            </div>
            {/* ── End Main Header Row ── */}

            {openCartSection && (
                <DisplayCartItem close={() => setOpenCartSection(false)} />
            )}
        </header>
    )
}

export default Header
