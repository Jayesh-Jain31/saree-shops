import React, { useEffect, useState } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from './Loading'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaMinus, FaPlus } from 'react-icons/fa6'

const AddToCartButton = ({ data }) => {
  const { fetchCartItem, updateCartItem, deleteCartItem } = useGlobalContext()
  const [loading, setLoading] = useState(false)
  const cartItem = useSelector(state => state.cartItem.cart)
  const user = useSelector(state => state.user)
  const [isAvailableCart, setIsAvailableCart] = useState(false)
  const [qty, setQty] = useState(0)
  const [cartItemDetails, setCartItemsDetails] = useState()
  const navigate = useNavigate()

  const handleADDTocart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user?._id) {
      toast('Please login to add items to cart', {
        icon: '🔒',
        style: { borderRadius: '10px', background: '#1f2937', color: '#fff' },
      })
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.addTocart,
        data: { productId: data?._id }
      })
      const { data: responseData } = response
      if (responseData.success) {
        toast.success(responseData.message)
        if (fetchCartItem) fetchCartItem()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkingitem = cartItem.some(item => item.productId._id === data._id)
    setIsAvailableCart(checkingitem)
    const product = cartItem.find(item => item.productId._id === data._id)
    setQty(product?.quantity)
    setCartItemsDetails(product)
  }, [data, cartItem])

  const increaseQty = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const response = await updateCartItem(cartItemDetails?._id, qty + 1)
    if (response.success) toast.success('Item added')
  }

  const decreaseQty = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (qty === 1) {
      deleteCartItem(cartItemDetails?._id)
    } else {
      const response = await updateCartItem(cartItemDetails?._id, qty - 1)
      if (response.success) toast.success('Item removed')
    }
  }

  return (
    <div className="w-full">
      {isAvailableCart ? (
        /* ── Quantity Counter ── */
        <div className="flex items-center w-full h-9 rounded-xl overflow-hidden border-2 border-primary">
          <button
            onClick={decreaseQty}
            className="btn-primary flex-1 h-full flex items-center justify-center transition-colors"
          >
            <FaMinus size={11} />
          </button>
          <span className="flex-1 h-full font-bold text-primary-text flex items-center justify-center text-sm bg-white select-none">
            {qty}
          </span>
          <button
            onClick={increaseQty}
            className="btn-primary flex-1 h-full flex items-center justify-center transition-colors"
          >
            <FaPlus size={11} />
          </button>
        </div>
      ) : (
        /* ── Add Button ── */
        <button
          onClick={handleADDTocart}
          className="btn-primary w-full h-9 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm"
        >
          {loading ? (
            <Loading />
          ) : (
            <>
              <FaPlus size={11} />
              <span>Add</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default AddToCartButton
