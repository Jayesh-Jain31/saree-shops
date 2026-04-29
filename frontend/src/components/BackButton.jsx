import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'

const BackButton = ({ label = 'Back', className = '' }) => {
    const navigate = useNavigate()

    return (
        <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 group ${className}`}
            aria-label='Go back'
        >
            <span className='w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-orange-50 group-hover:border-orange-300 transition-all duration-200 shadow-sm'>
                <FaArrowLeft size={11} className='text-gray-500 group-hover:text-orange-500 transition-colors duration-200' />
            </span>
            <span className='text-sm font-semibold text-gray-600 group-hover:text-orange-500 transition-colors duration-200'>
                {label}
            </span>
        </button>
    )
}

export default BackButton
