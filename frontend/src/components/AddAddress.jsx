import React from 'react'
import { useForm } from "react-hook-form"
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { IoClose } from "react-icons/io5";
import { useGlobalContext } from '../provider/GlobalProvider'

const FieldError = ({ msg }) => msg ? (
    <p className='text-red-500 text-xs mt-0.5'>{msg}</p>
) : null

const AddAddress = ({close}) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const { fetchAddress } = useGlobalContext()

    const onSubmit = async(data) => {
        try {
            const response = await Axios({
                ...SummaryApi.createAddress,
                data : {
                    address_line : data.addressline,
                    city : data.city,
                    state : data.state,
                    country : data.country,
                    pincode : data.pincode,
                    mobile : data.mobile
                }
            })

            const { data : responseData } = response

            if(responseData.success){
                toast.success(responseData.message)
                if(close){
                    close()
                    reset()
                    fetchAddress()
                }
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className='bg-black fixed top-0 left-0 right-0 bottom-0 z-50 bg-opacity-70 h-screen overflow-auto'>
            <div className='bg-white p-4 w-full max-w-lg mt-8 mx-auto rounded'>
                <div className='flex justify-between items-center gap-4'>
                    <h2 className='font-semibold'>Add Address</h2>
                    <button onClick={close} className='hover:text-red-500'>
                        <IoClose size={25}/>
                    </button>
                </div>
                <form className='mt-4 grid gap-3' onSubmit={handleSubmit(onSubmit)}>
                    <div className='grid gap-1'>
                        <label htmlFor='addressline' className='text-sm font-medium text-gray-700'>
                            Address Line <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='addressline'
                            placeholder='House no., Street, Locality'
                            className={`border p-2 rounded text-sm ${errors.addressline ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("addressline", {
                                required: "Address line is required",
                                minLength: { value: 5, message: "Please enter a valid address (min 5 characters)" }
                            })}
                        />
                        <FieldError msg={errors.addressline?.message} />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='city' className='text-sm font-medium text-gray-700'>
                            City <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='city'
                            placeholder='e.g. Mumbai'
                            className={`border p-2 rounded text-sm ${errors.city ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("city", {
                                required: "City is required",
                                minLength: { value: 2, message: "Please enter a valid city name" },
                                pattern: { value: /^[a-zA-Z\s]+$/, message: "City should contain only letters" }
                            })}
                        />
                        <FieldError msg={errors.city?.message} />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='state' className='text-sm font-medium text-gray-700'>
                            State <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='state'
                            placeholder='e.g. Maharashtra'
                            className={`border p-2 rounded text-sm ${errors.state ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("state", {
                                required: "State is required",
                                minLength: { value: 2, message: "Please enter a valid state name" },
                                pattern: { value: /^[a-zA-Z\s]+$/, message: "State should contain only letters" }
                            })}
                        />
                        <FieldError msg={errors.state?.message} />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='pincode' className='text-sm font-medium text-gray-700'>
                            Pincode <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='pincode'
                            placeholder='6-digit pincode'
                            maxLength={6}
                            className={`border p-2 rounded text-sm ${errors.pincode ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("pincode", {
                                required: "Pincode is required",
                                pattern: { value: /^[1-9][0-9]{5}$/, message: "Please enter a valid 6-digit pincode" }
                            })}
                        />
                        <FieldError msg={errors.pincode?.message} />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='country' className='text-sm font-medium text-gray-700'>
                            Country <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='country'
                            placeholder='e.g. India'
                            className={`border p-2 rounded text-sm ${errors.country ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("country", {
                                required: "Country is required",
                                minLength: { value: 2, message: "Please enter a valid country name" },
                                pattern: { value: /^[a-zA-Z\s]+$/, message: "Country should contain only letters" }
                            })}
                        />
                        <FieldError msg={errors.country?.message} />
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='mobile' className='text-sm font-medium text-gray-700'>
                            Mobile No. <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='mobile'
                            placeholder='10-digit mobile number'
                            maxLength={10}
                            className={`border p-2 rounded text-sm ${errors.mobile ? 'border-red-400 bg-red-50' : 'bg-blue-50'}`}
                            {...register("mobile", {
                                required: "Mobile number is required",
                                pattern: { value: /^[6-9][0-9]{9}$/, message: "Please enter a valid 10-digit mobile number (starting with 6-9)" }
                            })}
                        />
                        <FieldError msg={errors.mobile?.message} />
                    </div>

                    <button type='submit' className='bg-primary-200 w-full py-2.5 font-semibold mt-2 hover:bg-primary-100 rounded text-sm'>
                        Save Address
                    </button>
                </form>
            </div>
        </section>
    )
}

export default AddAddress
