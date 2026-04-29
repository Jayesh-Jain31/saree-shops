import React, { useEffect, useState } from 'react'
import UploadCategoryModel from '../components/UploadCategoryModel'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import EditCategory from '../components/EditCategory'
import CofirmBox from '../components/CofirmBox'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'

const CategoryPage = () => {
    const [openUploadCategory, setOpenUploadCategory] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categoryData, setCategoryData] = useState([])
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({ name: "", image: "" })
    const [openConfimBoxDelete, setOpenConfirmBoxDelete] = useState(false)
    const [deleteCategory, setDeleteCategory] = useState({ _id: "" })
    const [togglingId, setTogglingId] = useState(null)

    const fetchCategory = async () => {
        try {
            setLoading(true)
            const response = await Axios({ ...SummaryApi.getCategory })
            const { data: responseData } = response
            if (responseData.success) {
                setCategoryData(responseData.data)
            }
        } catch (error) {
            //
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategory()
    }, [])

    const handleDeleteCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.deleteCategory,
                data: deleteCategory
            })
            const { data: responseData } = response
            if (responseData.success) {
                toast.success(responseData.message)
                fetchCategory()
                setOpenConfirmBoxDelete(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handleToggleShowOnHome = async (category) => {
        setTogglingId(category._id)
        try {
            const response = await Axios({
                ...SummaryApi.updateCategory,
                data: { _id: category._id, showOnHome: !category.showOnHome }
            })
            const { data: responseData } = response
            if (responseData.success) {
                setCategoryData(prev =>
                    prev.map(c => c._id === category._id ? { ...c, showOnHome: !c.showOnHome } : c)
                )
                toast.success(
                    !category.showOnHome
                        ? `"${category.name}" is now visible on Home`
                        : `"${category.name}" hidden from Home`
                )
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <section>
            <div className='p-2 bg-white shadow-md flex items-center justify-between'>
                <h2 className='font-semibold'>Category</h2>
                <button
                    onClick={() => setOpenUploadCategory(true)}
                    className='text-sm border border-primary-200 hover:bg-primary-200 px-3 py-1 rounded'
                >
                    Add Category
                </button>
            </div>

            <div className='p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                {categoryData.map((category) => {
                    const isOn = category.showOnHome !== false
                    const isToggling = togglingId === category._id
                    return (
                        <div className='rounded-lg shadow-md bg-white overflow-hidden' key={category._id}>
                            <div className='relative'>
                                <img
                                    alt={category.name}
                                    src={category.image}
                                    className='w-full h-28 object-cover'
                                />
                                {!isOn && (
                                    <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                                        <span className='text-white text-xs font-bold bg-black/60 px-2 py-0.5 rounded'>Hidden</span>
                                    </div>
                                )}
                            </div>
                            <div className='p-2'>
                                <p className='text-sm font-semibold text-gray-700 mb-2 line-clamp-1'>{category.name}</p>

                                {/* Show on Home toggle */}
                                <button
                                    onClick={() => handleToggleShowOnHome(category)}
                                    disabled={isToggling}
                                    title={isOn ? 'Click to hide from Home page' : 'Click to show on Home page'}
                                    className={`w-full flex items-center justify-between gap-1 text-xs px-2 py-1.5 rounded mb-1.5 font-medium transition-colors ${
                                        isOn
                                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{isOn ? '🏠 On Home' : '🏠 Hidden'}</span>
                                    <span className={`w-8 h-4 rounded-full transition-colors flex items-center ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <span className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${isOn ? 'translate-x-4' : 'translate-x-0'}`}></span>
                                    </span>
                                </button>

                                <div className='flex gap-1'>
                                    <button
                                        onClick={() => { setOpenEdit(true); setEditData(category) }}
                                        className='flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium py-1 rounded'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { setOpenConfirmBoxDelete(true); setDeleteCategory(category) }}
                                        className='flex-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium py-1 rounded'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {loading && <Loading />}
            {!loading && categoryData.length === 0 && <NoData />}

            {openUploadCategory && (
                <UploadCategoryModel fetchData={fetchCategory} close={() => setOpenUploadCategory(false)} />
            )}

            {openEdit && (
                <EditCategory data={editData} close={() => setOpenEdit(false)} fetchData={fetchCategory} />
            )}

            {openConfimBoxDelete && (
                <CofirmBox
                    close={() => setOpenConfirmBoxDelete(false)}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    confirm={handleDeleteCategory}
                />
            )}
        </section>
    )
}

export default CategoryPage
