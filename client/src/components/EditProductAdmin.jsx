import React, { useState } from 'react'
import { FaCloudUploadAlt, FaPlus, FaTrash } from 'react-icons/fa'
import uploadImage from '../utils/UploadImage'
import Loading from '../components/Loading'
import ViewImage from '../components/ViewImage'
import { MdDelete } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { IoClose } from 'react-icons/io5'
import AddFieldComponent from '../components/AddFieldComponent'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import successAlert from '../utils/SuccessAlert'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const EditProductAdmin = ({ close, data: propsData, fetchProductData }) => {
  const [data, setData] = useState({
    _id: propsData._id,
    name: propsData.name,
    image: propsData.image,
    category: propsData.category,
    subCategory: propsData.subCategory,
    unit: propsData.unit,
    stock: propsData.stock,
    price: propsData.price,
    discount: propsData.discount,
    description: propsData.description,
    more_details: propsData.more_details || {},
    variants: propsData.variants || [],
  })
  const [imageLoading, setImageLoading] = useState(false)
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState(null)
  const [ViewImageURL, setViewImageURL] = useState('')
  const allCategory = useSelector(state => state.product.allCategory)
  const [selectCategory, setSelectCategory] = useState('')
  const [selectSubCategory, setSelectSubCategory] = useState('')
  const allSubCategory = useSelector(state => state.product.allSubCategory)
  const [openAddField, setOpenAddField] = useState(false)
  const [fieldName, setFieldName] = useState('')

  const [newVariant, setNewVariant] = useState({ name: '', price: '', stock: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageLoading(true)
    const response = await uploadImage(file)
    const { data: ImageResponse } = response
    const imageUrl = ImageResponse.data.url
    setData(prev => ({ ...prev, image: [...prev.image, imageUrl] }))
    setImageLoading(false)
  }

  const handleDeleteImage = (index) => {
    const newImages = [...data.image]
    newImages.splice(index, 1)
    setData(prev => ({ ...prev, image: newImages }))
  }

  const handleAiModelImage = async (imgUrl, index) => {
    setAiGeneratingIndex(index)
    const toastId = toast.loading('✨ AI is generating model image...')
    try {
      const res = await Axios({ ...SummaryApi.generateAiModelImage, data: { imageUrl: imgUrl } })
      if (res.data.success) {
        setData(prev => ({ ...prev, image: [...prev.image, res.data.data.url] }))
        toast.success('AI model image added!', { id: toastId })
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'AI generation failed', { id: toastId })
    } finally {
      setAiGeneratingIndex(null)
    }
  }

  const handleRemoveCategory = (index) => {
    const newCats = [...data.category]
    newCats.splice(index, 1)
    setData(prev => ({ ...prev, category: newCats }))
  }

  const handleRemoveSubCategory = (index) => {
    const newSubs = [...data.subCategory]
    newSubs.splice(index, 1)
    setData(prev => ({ ...prev, subCategory: newSubs }))
  }

  const handleAddField = () => {
    setData(prev => ({ ...prev, more_details: { ...prev.more_details, [fieldName]: '' } }))
    setFieldName('')
    setOpenAddField(false)
  }

  const handleAddVariant = () => {
    if (!newVariant.name.trim()) return
    setData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: newVariant.name.trim(),
        price: newVariant.price ? Number(newVariant.price) : null,
        stock: newVariant.stock ? Number(newVariant.stock) : null,
      }]
    }))
    setNewVariant({ name: '', price: '', stock: '' })
  }

  const handleRemoveVariant = (index) => {
    const newVars = [...data.variants]
    newVars.splice(index, 1)
    setData(prev => ({ ...prev, variants: newVars }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await Axios({ ...SummaryApi.updateProductDetails, data })
      const { data: responseData } = response
      if (responseData.success) {
        successAlert(responseData.message)
        if (close) close()
        fetchProductData()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const inputCls = 'bg-blue-50 p-2.5 outline-none border border-gray-200 focus-within:border-primary rounded-lg w-full text-sm'

  return (
    <section className='fixed inset-0 bg-black z-50 bg-opacity-70 p-4 overflow-auto'>
      <div className='bg-white w-full max-w-2xl mx-auto rounded-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10'>
          <h2 className='font-bold text-gray-800 text-lg'>Edit Product</h2>
          <button onClick={close} className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition'>
            <IoClose size={20} />
          </button>
        </div>

        <div className='p-5 overflow-y-auto max-h-[calc(100vh-80px)]'>
          <form className='grid gap-5' onSubmit={handleSubmit}>

            {/* Name */}
            <div className='grid gap-1.5'>
              <label className='text-sm font-semibold text-gray-700'>Product Name</label>
              <input type='text' placeholder='Enter product name' name='name' value={data.name} onChange={handleChange} required className={inputCls} />
            </div>

            {/* Description */}
            <div className='grid gap-1.5'>
              <label className='text-sm font-semibold text-gray-700'>Description</label>
              <textarea placeholder='Enter product description' name='description' value={data.description} onChange={handleChange} required rows={3} className={`${inputCls} resize-none`} />
            </div>

            {/* Images */}
            <div className='grid gap-1.5'>
              <label className='text-sm font-semibold text-gray-700'>Images</label>
              <label htmlFor='productImage' className='bg-blue-50 h-20 border-2 border-dashed border-blue-200 rounded-xl flex justify-center items-center cursor-pointer hover:bg-blue-100 transition'>
                {imageLoading ? <Loading /> : (
                  <div className='flex flex-col items-center gap-1 text-blue-500'>
                    <FaCloudUploadAlt size={28} />
                    <p className='text-xs font-medium'>Upload Image</p>
                  </div>
                )}
                <input type='file' id='productImage' className='hidden' accept='image/*' onChange={handleUploadImage} />
              </label>
              <div className='flex flex-wrap gap-3 mt-1'>
                {data.image.map((img, index) => (
                  <div key={img + index} className='bg-blue-50 border rounded-xl relative group overflow-hidden flex flex-col'>
                    <div className='h-20 w-20 relative'>
                      <img src={img} alt={img} className='w-full h-full object-cover cursor-pointer' onClick={() => setViewImageURL(img)} />
                      <button type='button' onClick={() => handleDeleteImage(index)}
                        className='absolute bottom-0 right-0 p-1 bg-red-600 text-white rounded-tl-lg hidden group-hover:block'>
                        <MdDelete size={14} />
                      </button>
                      {aiGeneratingIndex === index && (
                        <div className='absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl'>
                          <div className='w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                          <p className='text-[9px] text-purple-600 font-bold mt-1'>AI Working</p>
                        </div>
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => handleAiModelImage(img, index)}
                      disabled={aiGeneratingIndex !== null}
                      className='w-20 text-[9px] font-bold py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white flex items-center justify-center transition'
                    >
                      ✨ AI Model
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className='grid gap-1.5'>
              <label className='text-sm font-semibold text-gray-700'>Category</label>
              <select className={inputCls} value={selectCategory} onChange={(e) => {
                const cat = allCategory.find(el => el._id === e.target.value)
                if (cat) setData(prev => ({ ...prev, category: [...prev.category, cat] }))
                setSelectCategory('')
              }}>
                <option value=''>Select Category</option>
                {allCategory.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <div className='flex flex-wrap gap-2'>
                {data.category.map((c, i) => (
                  <span key={c._id + i} className='flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full'>
                    {c.name}
                    <button type='button' onClick={() => handleRemoveCategory(i)} className='hover:text-red-500'><IoClose size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Sub Category */}
            <div className='grid gap-1.5'>
              <label className='text-sm font-semibold text-gray-700'>Sub Category</label>
              <select className={inputCls} value={selectSubCategory} onChange={(e) => {
                const sub = allSubCategory.find(el => el._id === e.target.value)
                if (sub) setData(prev => ({ ...prev, subCategory: [...prev.subCategory, sub] }))
                setSelectSubCategory('')
              }}>
                <option value=''>Select Sub Category</option>
                {allSubCategory.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <div className='flex flex-wrap gap-2'>
                {data.subCategory.map((c, i) => (
                  <span key={c._id + i} className='flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full'>
                    {c.name}
                    <button type='button' onClick={() => handleRemoveSubCategory(i)} className='hover:text-red-500'><IoClose size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Unit / Stock / Price / Discount in 2-col grid */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-1.5'>
                <label className='text-sm font-semibold text-gray-700'>Unit</label>
                <input type='text' placeholder='e.g. 1 pc, 500g' name='unit' value={data.unit} onChange={handleChange} className={inputCls} />
              </div>
              <div className='grid gap-1.5'>
                <label className='text-sm font-semibold text-gray-700'>Stock</label>
                <input type='number' placeholder='0' name='stock' value={data.stock} onChange={handleChange} className={inputCls} />
              </div>
              <div className='grid gap-1.5'>
                <label className='text-sm font-semibold text-gray-700'>Price (₹)</label>
                <input type='number' placeholder='0' name='price' value={data.price} onChange={handleChange} className={inputCls} />
              </div>
              <div className='grid gap-1.5'>
                <label className='text-sm font-semibold text-gray-700'>Discount (%)</label>
                <input type='number' placeholder='0' name='discount' value={data.discount} onChange={handleChange} min='0' max='100' className={inputCls} />
              </div>
            </div>

            {/* ── Variants Section ── */}
            <div className='border border-purple-100 rounded-2xl overflow-hidden'>
              <div className='bg-purple-50 px-4 py-3 flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs'>🎨</div>
                <p className='text-sm font-bold text-purple-800'>Product Variants (Colors / Sizes)</p>
              </div>
              <div className='p-4 space-y-3'>
                <p className='text-xs text-gray-500'>Add variants like different colors or sizes. Each variant can have its own price and stock. Customers can select a variant on the product page to see that price.</p>

                {/* Existing variants */}
                {data.variants.length > 0 && (
                  <div className='space-y-2'>
                    {data.variants.map((v, i) => (
                      <div key={i} className='flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2'>
                        <div className='flex-1'>
                          <p className='text-sm font-semibold text-gray-800'>{v.name}</p>
                          <p className='text-xs text-gray-500'>
                            {v.price ? `₹${v.price}` : 'Same price'}
                            {v.stock !== null && v.stock !== undefined ? ` · Stock: ${v.stock}` : ''}
                          </p>
                        </div>
                        <button type='button' onClick={() => handleRemoveVariant(i)}
                          className='w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition flex-shrink-0'>
                          <FaTrash size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new variant */}
                <div className='bg-white border-2 border-dashed border-purple-200 rounded-xl p-3 space-y-2'>
                  <p className='text-xs font-semibold text-purple-700 mb-2'>Add New Variant</p>
                  <div className='grid grid-cols-3 gap-2'>
                    <div>
                      <label className='text-[10px] font-semibold text-gray-500 uppercase'>Name *</label>
                      <input type='text' placeholder='Red, Blue...'
                        value={newVariant.name}
                        onChange={e => setNewVariant(p => ({ ...p, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddVariant())}
                        className='w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 mt-0.5' />
                    </div>
                    <div>
                      <label className='text-[10px] font-semibold text-gray-500 uppercase'>Price ₹</label>
                      <input type='number' placeholder='999'
                        value={newVariant.price}
                        onChange={e => setNewVariant(p => ({ ...p, price: e.target.value }))}
                        className='w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 mt-0.5' />
                    </div>
                    <div>
                      <label className='text-[10px] font-semibold text-gray-500 uppercase'>Stock</label>
                      <input type='number' placeholder='10'
                        value={newVariant.stock}
                        onChange={e => setNewVariant(p => ({ ...p, stock: e.target.value }))}
                        className='w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-400 mt-0.5' />
                    </div>
                  </div>
                  <button type='button' onClick={handleAddVariant}
                    disabled={!newVariant.name.trim()}
                    className='w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg py-2 transition'>
                    <FaPlus size={12} /> Add Variant
                  </button>
                </div>
              </div>
            </div>

            {/* More Details (custom fields) */}
            {Object.keys(data.more_details).map((k, i) => (
              <div key={i} className='grid gap-1.5'>
                <label className='text-sm font-semibold text-gray-700'>{k}</label>
                <input type='text' value={data.more_details[k]}
                  onChange={e => setData(prev => ({ ...prev, more_details: { ...prev.more_details, [k]: e.target.value } }))}
                  className={inputCls} />
              </div>
            ))}

            <button type='button' onClick={() => setOpenAddField(true)}
              className='border border-primary text-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/5 transition w-max'>
              + Add Custom Field
            </button>

            <button type='submit'
              className='btn-primary w-full py-3 rounded-xl font-bold text-base'>
              Update Product
            </button>
          </form>
        </div>

        {ViewImageURL && <ViewImage url={ViewImageURL} close={() => setViewImageURL('')} />}
        {openAddField && (
          <AddFieldComponent value={fieldName} onChange={e => setFieldName(e.target.value)} submit={handleAddField} close={() => setOpenAddField(false)} />
        )}
      </div>
    </section>
  )
}

export default EditProductAdmin
