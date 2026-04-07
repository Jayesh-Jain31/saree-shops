import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { Link, useParams } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import CardProduct from '../components/CardProduct'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import { FaBoxOpen } from 'react-icons/fa'

const isValidObjectId = (id) => id && id !== 'undefined' && id !== 'null' && /^[a-f\d]{24}$/i.test(id)

const ProductListPage = () => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPage, setTotalPage] = useState(1)
  const [notFound, setNotFound] = useState(false)
  const params = useParams()
  const AllSubCategory = useSelector(state => state.product.allSubCategory)
  const [DisplaySubCatory, setDisplaySubCategory] = useState([])

  const subCategoryParam = params?.subCategory || ''
  const categoryParam   = params?.category   || ''

  const subCategoryParts = subCategoryParam.split('-')
  const categoryParts    = categoryParam.split('-')

  const subCategoryId   = subCategoryParts.slice(-1)[0]
  const categoryId      = categoryParts.slice(-1)[0]
  const subCategoryName = subCategoryParts.slice(0, -1).join(' ')

  const isValid = isValidObjectId(categoryId) && isValidObjectId(subCategoryId)

  const fetchProductdata = async () => {
    if (!isValid) {
      setNotFound(true)
      return
    }
    try {
      setLoading(true)
      setNotFound(false)
      const response = await Axios({
        ...SummaryApi.getProductByCategoryAndSubCategory,
        data: {
          categoryId,
          subCategoryId,
          page,
          limit: 8,
        }
      })
      const { data: responseData } = response
      if (responseData.success) {
        if (responseData.page === 1) {
          setData(responseData.data)
        } else {
          setData(prev => [...prev, ...responseData.data])
        }
        setTotalPage(responseData.totalCount)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductdata()
  }, [params])

  useEffect(() => {
    if (!isValidObjectId(categoryId)) return
    const sub = AllSubCategory.filter(s =>
      s.category.some(el => el._id === categoryId)
    )
    setDisplaySubCategory(sub)
  }, [params, AllSubCategory])

  if (notFound) {
    return (
      <section className='sticky top-24 lg:top-20'>
        <div className='container sticky top-24 mx-auto grid grid-cols-[90px,1fr] md:grid-cols-[200px,1fr] lg:grid-cols-[280px,1fr]'>

          {/* Empty sidebar */}
          <div className='min-h-[88vh] max-h-[88vh] overflow-y-scroll grid gap-1 shadow-md scrollbarCustom bg-white py-2'>
            {DisplaySubCatory.map((s) => {
              const link = `/${valideURLConvert(s?.category[0]?.name)}-${s?.category[0]?._id}/${valideURLConvert(s.name)}-${s._id}`
              return (
                <Link
                  key={s._id}
                  to={link}
                  className='w-full p-2 lg:flex items-center lg:w-full lg:h-16 box-border lg:gap-4 border-b hover:bg-green-100 cursor-pointer'
                >
                  <div className='w-fit max-w-28 mx-auto lg:mx-0 bg-white rounded box-border'>
                    <img src={s.image} alt='subCategory' className='w-14 lg:h-14 lg:w-12 h-full object-scale-down' />
                  </div>
                  <p className='-mt-6 lg:mt-0 text-xs text-center lg:text-left lg:text-base'>{s.name}</p>
                </Link>
              )
            })}
          </div>

          {/* Unavailable message */}
          <div className='sticky top-20 flex flex-col items-center justify-center min-h-[70vh] bg-gray-50 px-6 text-center'>
            <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
              <FaBoxOpen className='text-gray-300' size={36} />
            </div>
            <h2 className='text-lg font-bold text-gray-700 mb-1'>Category Unavailable</h2>
            <p className='text-sm text-gray-400 max-w-xs'>
              Sorry, this category doesn't exist or may have been removed. Please choose another category from the sidebar.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className='sticky top-24 lg:top-20'>
      <div className='container sticky top-24 mx-auto grid grid-cols-[90px,1fr] md:grid-cols-[200px,1fr] lg:grid-cols-[280px,1fr]'>

        {/* Sub category sidebar */}
        <div className='min-h-[88vh] max-h-[88vh] overflow-y-scroll grid gap-1 shadow-md scrollbarCustom bg-white py-2'>
          {DisplaySubCatory.map((s) => {
            const link = `/${valideURLConvert(s?.category[0]?.name)}-${s?.category[0]?._id}/${valideURLConvert(s.name)}-${s._id}`
            return (
              <Link
                key={s._id}
                to={link}
                className={`w-full p-2 lg:flex items-center lg:w-full lg:h-16 box-border lg:gap-4 border-b hover:bg-green-100 cursor-pointer ${subCategoryId === s._id ? 'bg-green-100' : ''}`}
              >
                <div className='w-fit max-w-28 mx-auto lg:mx-0 bg-white rounded box-border'>
                  <img src={s.image} alt='subCategory' className='w-14 lg:h-14 lg:w-12 h-full object-scale-down' />
                </div>
                <p className='-mt-6 lg:mt-0 text-xs text-center lg:text-left lg:text-base'>{s.name}</p>
              </Link>
            )
          })}
        </div>

        {/* Product grid */}
        <div className='sticky top-20'>
          <div className='bg-white shadow-md p-4 z-10'>
            <h3 className='font-semibold'>{subCategoryName || 'Products'}</h3>
          </div>

          <div className='min-h-[80vh] max-h-[80vh] overflow-y-auto relative'>
            {!loading && data.length === 0 && (
              <div className='flex flex-col items-center justify-center h-[60vh] text-center px-6'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3'>
                  <FaBoxOpen className='text-gray-300' size={28} />
                </div>
                <p className='font-semibold text-gray-600 mb-1'>No Products Found</p>
                <p className='text-xs text-gray-400'>There are no products in this category yet. Please check back later.</p>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-2 gap-3 md:p-4 md:gap-4'>
              {data.map((p, index) => (
                <CardProduct
                  data={p}
                  key={p._id + 'productSubCategory' + index}
                  grid
                />
              ))}
            </div>

            {loading && <Loading />}
          </div>
        </div>

      </div>
    </section>
  )
}

export default ProductListPage
