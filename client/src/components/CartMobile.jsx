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

  return (
    <>
      {cartItem[0] && (
        <div className="sticky bottom-4 p-2">
          <div className="bg-primary px-3 py-2 rounded-xl text-white text-sm flex items-center justify-between gap-3 lg:hidden shadow-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-dark)' }}>
                <FaCartShopping />
              </div>
              <div className="text-xs leading-tight">
                <p className="font-semibold">{totalQty} items</p>
                <p>{DisplayPriceInRupees(totalPrice)}</p>
              </div>
            </div>
            <Link to="/cart" className="flex items-center gap-1 font-semibold">
              <span>View Cart</span>
              <FaCaretRight />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

export default CartMobileLink
