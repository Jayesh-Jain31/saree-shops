import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
  FaShoppingBag, FaUsers, FaBoxOpen, FaChartLine, FaCrown
} from 'react-icons/fa'
import { MdInventory, MdTrendingUp } from 'react-icons/md'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getAnalytics })
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  if (!data) {
    return <div className='p-4 text-center text-gray-500'>Failed to load analytics</div>
  }

  const statusMap = {}
  data.statusCounts?.forEach(s => { statusMap[s._id] = s.count })

  const paymentMap = {}
  data.paymentCounts?.forEach(p => { paymentMap[p._id] = p.count })

  const maxMonthlyRevenue = Math.max(...(data.monthlyRevenue?.map(m => m.revenue) || [1]))

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
            <FaChartLine className='text-green-600' size={18} />
          </div>
          <div>
            <h1 className='font-bold text-xl text-gray-800'>Admin Dashboard</h1>
            <p className='text-xs text-gray-500'>Overview of your store</p>
          </div>
        </div>

        {/* Top Stats */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
          <div className='bg-white rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <MdTrendingUp className='text-green-600' size={20} />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Revenue</p>
                <p className='text-lg font-bold text-gray-800'>{DisplayPriceInRupees(data.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <FaShoppingBag className='text-blue-600' size={16} />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Orders</p>
                <p className='text-lg font-bold text-gray-800'>{data.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                <FaBoxOpen className='text-purple-600' size={16} />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Products</p>
                <p className='text-lg font-bold text-gray-800'>{data.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                <FaUsers className='text-orange-600' size={16} />
              </div>
              <div>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Users</p>
                <p className='text-lg font-bold text-gray-800'>{data.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-2 gap-4 mb-6'>
          {/* Order Status */}
          <div className='bg-white rounded-xl border p-4'>
            <h2 className='font-bold text-sm text-gray-800 mb-3'>Order Status</h2>
            <div className='space-y-2'>
              {['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(status => (
                <div key={status} className='flex items-center justify-between'>
                  <span className='text-xs text-gray-600'>{status}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-24 h-2 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className={`h-full rounded-full ${status === 'Delivered' ? 'bg-green-500' : status === 'Cancelled' ? 'bg-red-400' : 'bg-blue-400'}`}
                        style={{ width: `${Math.min(((statusMap[status] || 0) / Math.max(data.totalOrders, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className='text-xs font-bold text-gray-700 w-6 text-right'>{statusMap[status] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className='bg-white rounded-xl border p-4'>
            <h2 className='font-bold text-sm text-gray-800 mb-3'>Payment Methods</h2>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                <span className='text-sm text-green-700 font-medium'>Online (Razorpay)</span>
                <span className='text-lg font-bold text-green-700'>{paymentMap['PAID'] || 0}</span>
              </div>
              <div className='flex items-center justify-between p-3 bg-amber-50 rounded-lg'>
                <span className='text-sm text-amber-700 font-medium'>Cash on Delivery</span>
                <span className='text-lg font-bold text-amber-700'>{paymentMap['CASH ON DELIVERY'] || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        {data.monthlyRevenue?.length > 0 && (
          <div className='bg-white rounded-xl border p-4 mb-6'>
            <h2 className='font-bold text-sm text-gray-800 mb-4'>Monthly Revenue</h2>
            <div className='flex items-end gap-2 h-40'>
              {data.monthlyRevenue.slice().reverse().map((m, i) => (
                <div key={i} className='flex-1 flex flex-col items-center gap-1'>
                  <span className='text-[9px] text-gray-500 font-semibold'>
                    {DisplayPriceInRupees(m.revenue)}
                  </span>
                  <div
                    className='w-full bg-green-400 rounded-t-md min-h-[4px]'
                    style={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%` }}
                  />
                  <span className='text-[10px] text-gray-500'>
                    {months[m._id.month - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {data.topProducts?.length > 0 && (
          <div className='bg-white rounded-xl border p-4 mb-6'>
            <h2 className='font-bold text-sm text-gray-800 mb-3 flex items-center gap-2'>
              <FaCrown className='text-yellow-500' size={14} /> Top Selling Products
            </h2>
            <div className='space-y-2'>
              {data.topProducts.map((p, i) => (
                <div key={i} className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50'>
                  <span className='w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center'>
                    {i + 1}
                  </span>
                  {p.image?.[0] && (
                    <img src={p.image[0]} alt='' className='w-10 h-10 object-contain rounded border bg-gray-50' />
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-700 truncate'>{p._id}</p>
                  </div>
                  <span className='text-sm font-bold text-gray-700'>{p.totalQty} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className='bg-white rounded-xl border p-4'>
          <h2 className='font-bold text-sm text-gray-800 mb-3'>Recent Orders</h2>
          {/* Desktop table */}
          <div className='hidden sm:block overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left'>
                  <th className='pb-2 text-xs text-gray-400 font-semibold'>Order ID</th>
                  <th className='pb-2 text-xs text-gray-400 font-semibold'>Customer</th>
                  <th className='pb-2 text-xs text-gray-400 font-semibold'>Amount</th>
                  <th className='pb-2 text-xs text-gray-400 font-semibold'>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders?.map((order) => (
                  <tr key={order._id} className='border-b last:border-0 hover:bg-gray-50'>
                    <td className='py-2 font-mono text-xs text-gray-600'>{order.orderId}</td>
                    <td className='py-2 text-xs text-gray-700'>{order.userId?.name || 'N/A'}</td>
                    <td className='py-2 text-xs font-semibold'>{DisplayPriceInRupees(order.totalAmt)}</td>
                    <td className='py-2'>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                        ${order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-700' :
                          order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className='sm:hidden space-y-2'>
            {data.recentOrders?.map((order) => (
              <div key={order._id} className='border rounded-lg p-3'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='font-mono text-[11px] text-gray-500'>{order.orderId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                    ${order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-700' :
                      order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-700'>{order.userId?.name || 'N/A'}</span>
                  <span className='text-xs font-bold text-gray-800'>{DisplayPriceInRupees(order.totalAmt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
