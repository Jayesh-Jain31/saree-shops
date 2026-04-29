import React from 'react'

const CardLoading = () => {
  return (
    <div className='border rounded-xl bg-white flex flex-col overflow-hidden min-w-36 lg:min-w-52 animate-pulse'>
      <div className='w-full aspect-square bg-blue-50'></div>
      <div className='p-2 flex flex-col gap-2'>
        <div className='h-3 bg-blue-50 rounded w-3/4'></div>
        <div className='h-3 bg-blue-50 rounded w-1/2'></div>
        <div className='h-3 bg-blue-50 rounded w-1/3'></div>
        <div className='flex justify-between mt-1'>
          <div className='h-4 bg-blue-50 rounded w-16'></div>
          <div className='h-7 bg-blue-50 rounded w-12'></div>
        </div>
      </div>
    </div>
  )
}

export default CardLoading
