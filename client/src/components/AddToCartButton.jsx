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

const AddToCartButton = ({ data, compact = false }) => {
  const { fetchCartItem, updateCartItem, deleteCartItem } = useGlobalContext()
  const [loading, setLoading] = useState(false)
  const cartItem = useSelector(state => state.cartItem.cart)
  const user = useSelector(state => state.user)
  const [isAvailableCart, setIsAvailableCart] = useState(false)
  const [qty, setQty] = useState(0)
  const [cartItemDetails, setCartItemsDetails] = useState()
  const [bounce, setBounce] = useState(false)
  const navigate = useNavigate()

  const maxStock = data?.stock ?? Infinity
  const atMaxStock = qty >= maxStock

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
    setQty(product?.quantity ?? 0)
    setCartItemsDetails(product)
  }, [data, cartItem])

  const triggerBounce = () => {
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
  }

  const increaseQty = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (atMaxStock) {
      toast.error(`Only ${maxStock} in stock`, { icon: '⚠️' })
      return
    }
    triggerBounce()
    const response = await updateCartItem(cartItemDetails?._id, qty + 1)
    if (response.success) toast.success('Added')
  }

  const decreaseQty = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    triggerBounce()
    if (qty === 1) {
      deleteCartItem(cartItemDetails?._id)
    } else {
      const response = await updateCartItem(cartItemDetails?._id, qty - 1)
      if (response.success) toast.success('Removed')
    }
  }

  if (compact) {
    return (
      <div className="w-full" onClick={e => e.preventDefault()}>
        {isAvailableCart ? (
          <div className="flex items-center justify-between w-full border-2 border-primary rounded-xl overflow-hidden">
            <button
              onClick={decreaseQty}
              className="btn-primary w-8 h-8 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <FaMinus size={10} />
            </button>
            <span
              key={qty}
              className={`flex-1 text-center font-bold text-primary text-sm select-none ${bounce ? 'scale-125' : 'scale-100'}`}
              style={{ transition: 'transform 0.15s ease' }}
            >
              {qty}
            </span>
            <button
              onClick={increaseQty}
              disabled={atMaxStock}
              className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all ${
                atMaxStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'btn-primary active:scale-90'
              }`}
            >
              <FaPlus size={10} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleADDTocart}
            className="border-2 border-primary text-primary bg-white w-full h-8 font-bold rounded-xl text-xs tracking-wide hover:bg-primary hover:text-white active:scale-95 transition-all duration-150"
          >
            {loading ? <Loading /> : 'ADD'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full" onClick={e => e.preventDefault()}>
      {isAvailableCart ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full gap-1">
            <button
              onClick={decreaseQty}
              className="btn-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow active:scale-75 transition-transform duration-150"
            >
              <FaMinus size={11} />
            </button>
            <span
              key={qty}
              className={`flex-1 text-center font-bold text-primary text-base select-none transition-all ${bounce ? 'scale-125' : 'scale-100'}`}
              style={{ transition: 'transform 0.15s ease' }}
            >
              {qty}
            </span>
            <button
              onClick={increaseQty}
              disabled={atMaxStock}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow transition-all duration-150 ${
                atMaxStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'btn-primary active:scale-75'
              }`}
            >
              <FaPlus size={11} />
            </button>
          </div>
          {atMaxStock && (
            <p className="text-[9px] text-center text-red-500 font-bold uppercase tracking-wide leading-tight">
              Max stock reached
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={handleADDTocart}
          className="border-2 border-primary text-primary bg-white w-full h-9 font-bold rounded-xl text-sm tracking-wide hover:bg-primary hover:text-white active:scale-95 transition-all duration-150"
        >
          {loading ? <Loading /> : 'ADD'}
        </button>
      )}
    </div>
  )
}

export default AddToCartButton
