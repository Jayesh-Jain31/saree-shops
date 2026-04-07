import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import CardProduct from '../components/CardProduct'
import { FaBoxOpen } from 'react-icons/fa'

const AllCategoriesPage = () => {
  const allCategory = useSelector(state => state.product.allCategory)
  const [selectedCat, setSelectedCat] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  // Auto-select first category on load
  useEffect(() => {
    if (allCategory?.length && !selectedCat) {
      setSelectedCat(allCategory[0])
    }
  }, [allCategory])

  // Fetch products when category changes
  useEffect(() => {
    if (!selectedCat?._id) return
    const fetch = async () => {
      setLoading(true)
      setProducts([])
      try {
        const res = await Axios({
          ...SummaryApi.getProductByCategory,
          data: { id: selectedCat._id }
        })
        if (res.data.success) {
          setProducts(res.data.data || [])
        }
      } catch (e) {}
      finally { setLoading(false) }
    }
    fetch()
  }, [selectedCat])

  return (
    <div className='flex h-[calc(100vh-64px)] bg-gray-50'>

      {/* ── Left sidebar ── */}
      <aside className='w-24 sm:w-28 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto'>
        {allCategory.map(cat => {
          const active = selectedCat?._id === cat._id
          return (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(cat)}
              className={`w-full flex flex-col items-center gap-1.5 px-1 py-3 border-b border-gray-50 transition-all ${
                active
                  ? 'bg-pink-50 border-l-4 border-l-[var(--primary,#ec4899)]'
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all ${
                active ? 'border-[var(--primary,#ec4899)]' : 'border-gray-100'
              }`}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  className='w-full h-full object-cover'
                />
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 ${
                active ? 'text-[var(--primary,#ec4899)]' : 'text-gray-600'
              }`}>
                {cat.name}
              </span>
            </button>
          )
        })}
      </aside>

      {/* ── Right content ── */}
      <main className='flex-1 overflow-y-auto'>

        {/* Category header */}
        {selectedCat && (
          <div className='sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3'>
            <div className='w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0'>
              <img src={selectedCat.image} alt={selectedCat.name} className='w-full h-full object-cover' />
            </div>
            <h2 className='font-bold text-gray-800 text-base'>{selectedCat.name}</h2>
          </div>
        )}

        <div className='p-3'>
          {loading ? (
            /* Skeleton */
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {new Array(8).fill(null).map((_, i) => (
                <div key={i} className='bg-white rounded-2xl p-3 animate-pulse'>
                  <div className='bg-gray-100 aspect-square rounded-xl mb-2' />
                  <div className='bg-gray-100 h-3 rounded w-3/4 mb-1' />
                  <div className='bg-gray-100 h-3 rounded w-1/2' />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-gray-400 gap-3'>
              <FaBoxOpen size={48} />
              <p className='text-sm font-medium'>No products in this category yet</p>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {products.map(p => (
                <CardProduct key={p._id} data={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AllCategoriesPage
