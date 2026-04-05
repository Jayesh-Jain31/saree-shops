import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import { FaBoxOpen, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { MdEdit } from 'react-icons/md'

const statusOptions = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

const statusColors = {
  'Pending': 'bg-yellow-50 text-yellow-700',
  'Confirmed': 'bg-blue-50 text-blue-700',
  'Shipped': 'bg-indigo-50 text-indigo-700',
  'Out for Delivery': 'bg-purple-50 text-purple-700',
  'Delivered': 'bg-green-50 text-green-700',
  'Cancelled': 'bg-red-50 text-red-700',
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [editingOrder, setEditingOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getAllOrdersAdmin,
        data: { page, status: filterStatus, search, limit: 15 }
      })
      if (response.data.success) {
        setOrders(response.data.data.orders)
        setTotalPages(response.data.data.totalPages)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, filterStatus])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const handleUpdateStatus = async (orderId) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateOrderStatusAdmin,
        data: { orderId, status: newStatus }
      })
      if (response.data.success) {
        toast.success('Order status updated')
        setEditingOrder(null)
        fetchOrders()
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
            <FaBoxOpen className='text-blue-600' size={18} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>Manage Orders</h1>
            <p className='text-xs text-gray-500'>View and update all customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl border p-3 mb-4 flex flex-col sm:flex-row gap-2'>
          <form onSubmit={handleSearch} className='relative flex-1'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search by Order ID...'
              className='w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500 bg-gray-50'
            />
          </form>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className='px-3 py-2 border rounded-lg text-sm bg-gray-50 cursor-pointer'
          >
            <option value='all'>All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Orders Table */}
        <div className='bg-white rounded-xl border overflow-hidden'>
          {loading ? (
            <div className='p-8 text-center'>
              <div className='w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
            </div>
          ) : orders.length === 0 ? (
            <div className='p-8 text-center text-gray-400'>
              <FaBoxOpen size={32} className='mx-auto mb-2' />
              <p>No orders found</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-gray-50 border-b'>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Order ID</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Customer</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Items</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Amount</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Payment</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Date</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Status</th>
                    <th className='p-3 text-left text-xs text-gray-500 font-semibold'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className='border-b last:border-0 hover:bg-gray-50'>
                      <td className='p-3 font-mono text-xs text-gray-600'>{order.orderId}</td>
                      <td className='p-3'>
                        <p className='text-xs font-medium text-gray-700'>{order.userId?.name || 'N/A'}</p>
                        <p className='text-[10px] text-gray-400'>{order.userId?.email || ''}</p>
                      </td>
                      <td className='p-3 text-xs text-gray-600'>
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className='p-3 text-xs font-semibold text-gray-700'>{DisplayPriceInRupees(order.totalAmt)}</td>
                      <td className='p-3'>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                          ${order.payment_status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {order.payment_status === 'PAID' ? 'Online' : 'COD'}
                        </span>
                      </td>
                      <td className='p-3 text-xs text-gray-500'>{formatDate(order.createdAt)}</td>
                      <td className='p-3'>
                        {editingOrder === order._id ? (
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className='text-xs border rounded px-2 py-1'
                          >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[order.orderStatus] || ''}`}>
                            {order.orderStatus}
                          </span>
                        )}
                      </td>
                      <td className='p-3'>
                        {editingOrder === order._id ? (
                          <div className='flex gap-1'>
                            <button
                              onClick={() => handleUpdateStatus(order._id)}
                              className='text-[10px] bg-green-600 text-white px-2 py-1 rounded font-medium hover:bg-green-700'
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOrder(null)}
                              className='text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium hover:bg-gray-300'
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingOrder(order._id); setNewStatus(order.orderStatus) }}
                            className='text-gray-400 hover:text-green-600 transition-colors'
                            title='Edit status'
                          >
                            <MdEdit size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='p-3 border-t flex items-center justify-between'>
              <p className='text-xs text-gray-500'>Page {page} of {totalPages}</p>
              <div className='flex gap-1'>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminOrders
