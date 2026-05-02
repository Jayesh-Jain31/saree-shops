import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Divider from './Divider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { HiOutlineExternalLink } from "react-icons/hi"
import {
  MdDashboard, MdOutlineShoppingBag, MdOutlineCategory,
  MdOutlineUploadFile, MdOutlineInventory2, MdOutlineLocalOffer,
  MdOutlineDeliveryDining, MdOutlineImage, MdSettings
} from 'react-icons/md'
import { HiDocumentText } from 'react-icons/hi'
import { FiPackage, FiHeart, FiMapPin, FiLogOut, FiUser, FiRefreshCw } from 'react-icons/fi'
import { FaShieldAlt, FaBoxOpen, FaGift } from 'react-icons/fa'
import { MdAccountBalanceWallet } from 'react-icons/md'
import { GiDiamondTrophy } from 'react-icons/gi'
import isAdmin from '../utils/isAdmin'

const UserMenu = ({ close }) => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const response = await Axios({ ...SummaryApi.logout })
      if (response.data.success) {
        if (close) close()
        dispatch(logout())
        localStorage.clear()
        toast.success(response.data.message)
        navigate("/")
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleClose = () => { if (close) close() }

  const MenuItem = ({ to, icon: Icon, label, color = 'text-gray-600' }) => (
    <Link
      onClick={handleClose}
      to={to}
      className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors group'
    >
      <Icon size={16} className={`${color} group-hover:text-orange-600`} />
      <span>{label}</span>
    </Link>
  )

  return (
    <div className='min-w-[220px]'>
      {/* User info */}
      <div className='px-3 py-2'>
        <div className='font-bold text-gray-800'>My Account</div>
        <div className='text-sm flex items-center gap-2 mt-0.5'>
          <span className='max-w-52 text-ellipsis line-clamp-1 text-gray-500'>
            {user.name || user.mobile}
            {user.role === "ADMIN" && (
              <span className='ml-1 text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full'>Admin</span>
            )}
          </span>
          <Link onClick={handleClose} to={"/dashboard/profile"} className='text-gray-400 hover:text-gray-600'>
            <HiOutlineExternalLink size={15} />
          </Link>
        </div>
      </div>

      <Divider />

      {/* Admin Section */}
      {isAdmin(user.role) && (
        <>
          <p className='px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Admin Panel</p>
          <div className='text-sm grid gap-0.5 px-1'>
            <MenuItem to="/dashboard/admin-dashboard" icon={MdDashboard} label="Analytics" color="text-purple-500" />
            <MenuItem to="/dashboard/admin-orders" icon={MdOutlineShoppingBag} label="Manage Orders" color="text-blue-500" />
            <MenuItem to="/dashboard/category" icon={MdOutlineCategory} label="Categories" color="text-green-500" />
            <MenuItem to="/dashboard/subcategory" icon={MdOutlineCategory} label="Sub Categories" color="text-green-400" />
            <MenuItem to="/dashboard/upload-product" icon={MdOutlineUploadFile} label="Upload Product" color="text-orange-500" />
            <MenuItem to="/dashboard/product" icon={MdOutlineInventory2} label="Products" color="text-orange-400" />
            <MenuItem to="/dashboard/coupons" icon={MdOutlineLocalOffer} label="Coupons" color="text-pink-500" />
            <MenuItem to="/dashboard/delivery-zones" icon={MdOutlineDeliveryDining} label="Delivery Zones" color="text-teal-500" />
            <MenuItem to="/dashboard/banners" icon={MdOutlineImage} label="Manage Banners" color="text-indigo-500" />
            <MenuItem to="/dashboard/admin-returns" icon={FiRefreshCw} label="Return Requests" color="text-orange-500" />
            <MenuItem to="/dashboard/fraud-detection" icon={FaShieldAlt} label="Fraud Detection" color="text-red-500" />
            <MenuItem to="/dashboard/admin-loyalty" icon={GiDiamondTrophy} label="Loyalty Points" color="text-yellow-500" />
            <MenuItem to="/dashboard/admin-bundles" icon={FaBoxOpen} label="Bundle Deals" color="text-purple-500" />
            <MenuItem to="/dashboard/free-gifts" icon={FaGift} label="Free Gifts" color="text-rose-500" />
            <MenuItem to="/dashboard/policy-pages" icon={HiDocumentText} label="Policy Pages" color="text-indigo-400" />
            <MenuItem to="/dashboard/site-settings" icon={MdSettings} label="Site Settings" color="text-gray-500" />
          </div>
          <Divider />
        </>
      )}

      {/* Customer Section */}
      <p className='px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest'>My Account</p>
      <div className='text-sm grid gap-0.5 px-1'>
        <MenuItem to="/dashboard/myorders" icon={FiPackage} label="My Orders" />
        <MenuItem to="/dashboard/my-returns" icon={FiRefreshCw} label="My Returns" color="text-orange-400" />
        <MenuItem to="/dashboard/bundles" icon={FaBoxOpen} label="Bundle Deals" color="text-purple-500" />
        <MenuItem to="/dashboard/wallet" icon={MdAccountBalanceWallet} label="My Wallet" color="text-green-500" />
        <MenuItem to="/dashboard/loyalty" icon={GiDiamondTrophy} label="Loyalty Points" color="text-yellow-500" />
        <MenuItem to="/dashboard/wishlist" icon={FiHeart} label="My Wishlist" color="text-red-400" />
        <MenuItem to="/dashboard/address" icon={FiMapPin} label="Saved Addresses" color="text-blue-400" />
        <button
          onClick={handleLogout}
          className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-left text-gray-600 w-full'
        >
          <FiLogOut size={16} className='text-red-400' />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}

export default UserMenu
