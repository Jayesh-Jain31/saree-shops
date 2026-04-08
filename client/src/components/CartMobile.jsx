import React from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { FaCartShopping } from 'react-icons/fa6'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { FaCaretRight } from 'react-icons/fa'
import { useSelector } from 'react-redux'

const CartMobileLink = () => {
  const { totalPrice, totalQty } = useGlobalContext()
  const cartItem = useSelector(state => state.cartItem.cart)

  if (!cartItem[0]) return null

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-20 lg:hidden" />

      {/* Fixed floating cart bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 lg:hidden"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <Link
          to="/cart"
          className="flex items-center justify-between gap-3 w-full bg-primary text-white px-4 py-3 rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--primary-dark)' }}>
              <FaCartShopping size={16} />
            </div>
            <div className="text-xs leading-tight">
              <p className="font-bold text-sm">{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
              <p className="opacity-90">{DisplayPriceInRupees(totalPrice)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-sm">
            <span>View Cart</span>
            <FaCaretRight size={14} />
          </div>
        </Link>
      </div>
    </>
  )
}

export default CartMobileLink
