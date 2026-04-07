import React, { useEffect, useState, useMemo } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'
import {
  FaBoxOpen, FaSearch, FaChevronLeft, FaChevronRight, FaFilter,
  FaCheckCircle, FaMoneyBillWave, FaCreditCard, FaTruck, FaTimes,
  FaUser, FaPhone, FaMapMarkerAlt, FaTag, FaPrint, FaUndoAlt, FaRocket
} from 'react-icons/fa'
import {
  MdAccessTime, MdDone, MdInventory, MdPending, MdEdit, MdSave,
  MdClose, MdLocalShipping, MdDeliveryDining, MdEmail
} from 'react-icons/md'

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

const statusConfig = {
  'Pending':          { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-400', icon: <MdPending size={12} /> },
  'Confirmed':        { color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400',   icon: <FaCheckCircle size={10} /> },
  'Shipped':          { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',    dot: 'bg-indigo-400', icon: <MdInventory size={12} /> },
  'Out for Delivery': { color: 'bg-purple-50 text-purple-700 border-purple-200',   dot: 'bg-purple-400', icon: <FaTruck size={11} /> },
  'Delivered':        { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400',icon: <MdDone size={13} /> },
  'Cancelled':        { color: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-400',    icon: <FaTimes size={10} /> },
}

const statusSteps = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered']

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const fmtRel = (d) => {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  if (diff < 10080) return `${Math.floor(diff/1440)}d ago`
  return fmt(d)
}

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Pending']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      {cfg.icon} {status || 'Pending'}
    </span>
  )
}

const PaymentBadge = ({ status }) => {
  if (!status) return null
  const isCOD = status.toUpperCase() === 'CASH ON DELIVERY'
  return isCOD
    ? <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200'><FaMoneyBillWave size={9} />COD</span>
    : <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200'><FaCreditCard size={9} />Online Paid</span>
}

/* ─────────── FULL ORDER DETAIL DRAWER ─────────── */
const OrderDetailDrawer = ({ orderId, onClose, onStatusUpdate }) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [shipping, setShipping] = useState(false)

  useEffect(() => {
    if (!orderId) return
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await Axios({
          ...SummaryApi.getAdminOrderDetail,
          params: { orderId }
        })
        if (res.data.success) {
          setOrder(res.data.data)
          setNewStatus(res.data.data.orderStatus)
        }
      } catch { toast.error('Failed to load order details') }
      finally { setLoading(false) }
    }
    fetch()
  }, [orderId])

  const handleSaveStatus = async () => {
    setSaving(true)
    try {
      const res = await Axios({ ...SummaryApi.updateOrderStatusAdmin, data: { orderId: order._id, status: newStatus } })
      if (res.data.success) {
        toast.success('Status updated')
        setOrder(o => ({ ...o, orderStatus: newStatus }))
        setEditingStatus(false)
        onStatusUpdate(order._id, newStatus)
      }
    } catch { toast.error('Failed to update status') }
    finally { setSaving(false) }
  }

  const handleShiprocket = async () => {
    setShipping(true)
    try {
      const res = await Axios({ ...SummaryApi.createShiprocketOrder, data: { orderId: order._id } })
      if (res.data.success) {
        toast.success('Shipment created on Shiprocket!')
        setOrder(o => ({ ...o, shiprocketOrderId: res.data.data.shiprocketOrderId, shipmentId: res.data.data.shipmentId, orderStatus: 'Shipped' }))
        onStatusUpdate(order._id, 'Shipped')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Shiprocket error. Check credentials.'
      toast.error(msg)
    } finally {
      setShipping(false)
    }
  }

  const esc = (str) => String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')

  const handlePrint = () => {
    if (!order) return
    const items = order.items || []
    const addr = order.delivery_address || {}
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Order ${esc(order.orderId)}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;padding:32px;color:#333;max-width:800px;margin:0 auto}
    .brand{font-size:22px;font-weight:700;color:#16a34a}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #16a34a;padding-bottom:16px;margin-bottom:24px}
    h3{font-size:12px;text-transform:uppercase;color:#999;letter-spacing:.5px;margin-bottom:6px}
    table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f8f9fa;padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#666;border-bottom:2px solid #e5e7eb}
    td{padding:10px;border-bottom:1px solid #f3f4f6;font-size:13px}.tr{text-align:right}.totals{margin-top:16px}.trow{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
    .grand{border-top:2px solid #333;padding-top:10px;margin-top:6px;font-size:16px;font-weight:700;color:#16a34a}.badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600}
    .bg-green{background:#dcfce7;color:#16a34a}.bg-amber{background:#fef3c7;color:#d97706}@media print{body{padding:16px}}</style></head>
    <body><div class="hdr"><div><div class="brand">Binkeyit</div><p style="font-size:11px;color:#999;margin-top:3px">Admin Order Copy</p></div>
    <div style="text-align:right"><div style="font-size:20px;font-weight:700">ORDER RECEIPT</div>
    <div style="font-size:12px;color:#666;margin-top:4px">#${order.orderId}<br>${fmtFull(order.createdAt)}</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px">
    <div><h3>Customer</h3><p style="font-size:13px">${esc(order.userId?.name || 'N/A')}</p>
    ${order.userId?.email ? `<p style="font-size:12px;color:#666">${esc(order.userId.email)}</p>` : ''}
    ${order.userId?.mobile ? `<p style="font-size:12px;color:#666">${esc(order.userId.mobile)}</p>` : ''}</div>
    <div><h3>Delivery Address</h3><p style="font-size:13px;line-height:1.5">${addr.address_line || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}</p>
    ${addr.mobile ? `<p style="font-size:12px;color:#666">📞 ${esc(addr.mobile)}</p>` : ''}</div></div>
    <div style="margin-bottom:16px"><h3>Payment</h3>
    <span class="badge ${order.payment_status?.toUpperCase() === 'PAID' ? 'bg-green' : 'bg-amber'}">${order.payment_status?.toUpperCase() === 'PAID' ? 'Online Paid' : 'Cash on Delivery'}</span>
    ${order.paymentId ? `<span style="font-size:11px;color:#999;margin-left:8px;font-family:monospace">${esc(order.paymentId)}</span>` : ''}</div>
    <h3>Items</h3>
    <table><thead><tr><th>#</th><th>Product</th><th class="tr">Qty</th><th class="tr">Price</th></tr></thead><tbody>
    ${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.product_details?.name || 'Product'}</td><td class="tr">${item.quantity || 1}</td><td class="tr">₹${item.price || 0}</td></tr>`).join('')}
    </tbody></table>
    <div class="totals">${order.couponCode && order.couponDiscount > 0 ? `<div class="trow"><span>Coupon (${order.couponCode})</span><span style="color:#16a34a">- ₹${order.couponDiscount}</span></div>` : ''}${order.walletDeduction > 0 ? `<div class="trow"><span>Wallet used</span><span style="color:#2563eb">- ₹${order.walletDeduction}</span></div>` : ''}${!order.couponCode && !order.walletDeduction && order.discountAmt > 0 ? `<div class="trow"><span>Discount</span><span style="color:#16a34a">- ₹${order.discountAmt}</span></div>` : ''}
    <div class="trow grand"><span>Grand Total</span><span>₹${order.totalAmt}</span></div></div>
    <p style="margin-top:32px;text-align:center;font-size:11px;color:#999">Order Status: ${order.orderStatus}</p>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  if (!orderId) return null

  const currentStatusIndex = statusSteps.indexOf(order?.orderStatus)
  const isCancelled = order?.orderStatus === 'Cancelled'

  return (
    <>
      {/* Overlay */}
      <div className='fixed inset-0 bg-black/40 z-40 backdrop-blur-sm' onClick={onClose} />
      {/* Drawer */}
      <div className='fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl overflow-y-auto flex flex-col'
        style={{ animation: 'slideInRight 0.25s ease' }}>

        {/* Drawer Header */}
        <div className='sticky top-0 bg-white border-b z-10 px-5 py-4 flex items-center justify-between'>
          <div>
            <h2 className='font-bold text-gray-800 text-base'>Order Details</h2>
            <p className='text-[11px] font-mono text-gray-400 mt-0.5'>{order?.orderId || '...'}</p>
          </div>
          <div className='flex items-center gap-2'>
            {order && (
              <button
                onClick={handlePrint}
                className='w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600'
                title='Print / Download'
              >
                <FaPrint size={13} />
              </button>
            )}
            <button onClick={onClose} className='w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center'>
              <MdClose size={18} className='text-gray-600' />
            </button>
          </div>
        </div>

        {loading ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : !order ? (
          <div className='flex-1 flex items-center justify-center text-gray-400'>
            <p>Order not found</p>
          </div>
        ) : (
          <div className='p-5 space-y-4 flex-1'>
            {/* Status & Timeline */}
            <div className='bg-white rounded-2xl border p-4'>
              <div className='flex items-center justify-between mb-4'>
                <StatusBadge status={order.orderStatus} />
                <span className='text-[11px] text-gray-400'>{fmtFull(order.createdAt)}</span>
              </div>

              {isCancelled ? (
                <div className='bg-red-50 rounded-xl p-3 flex items-center gap-2'>
                  <FaTimes className='text-red-500' size={14} />
                  <p className='text-sm font-medium text-red-700'>This order has been cancelled</p>
                </div>
              ) : (
                <div className='flex items-center gap-1'>
                  {statusSteps.map((s, i) => {
                    const done = i <= currentStatusIndex
                    const current = i === currentStatusIndex
                    return (
                      <React.Fragment key={s}>
                        <div className='flex flex-col items-center gap-1'>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all
                            ${done ? current ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200' : 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                            {done && !current ? <MdDone size={12} /> : <span>{i + 1}</span>}
                          </div>
                          <p className={`text-[9px] text-center font-medium leading-tight max-w-12 ${done ? 'text-green-700' : 'text-gray-300'}`}>
                            {s === 'Out for Delivery' ? 'Out for Del.' : s}
                          </p>
                        </div>
                        {i < statusSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-4 ${done && i < currentStatusIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}

              {/* Status Update */}
              <div className='mt-4 pt-3 border-t border-gray-100'>
                {editingStatus ? (
                  <div className='flex items-center gap-2'>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className='flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-green-500 bg-gray-50'
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={handleSaveStatus} disabled={saving}
                      className='px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1'>
                      <MdSave size={14} />{saving ? '...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingStatus(false); setNewStatus(order.orderStatus) }}
                      className='w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-gray-50'>
                      <MdClose size={16} className='text-gray-500' />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingStatus(true)}
                    className='w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors'>
                    <MdEdit size={14} /> Update Order Status
                  </button>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className='bg-white rounded-2xl border p-4'>
              <h3 className='font-bold text-gray-700 text-sm mb-3 flex items-center gap-2'>
                <FaUser className='text-blue-500' size={13} /> Customer Details
              </h3>
              <div className='flex items-start gap-3'>
                <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
                  {(order.userId?.name || 'U')[0].toUpperCase()}
                </div>
                <div className='space-y-1.5'>
                  <p className='font-semibold text-gray-800'>{order.userId?.name || 'Unknown'}</p>
                  {order.userId?.email && (
                    <p className='text-xs text-gray-500 flex items-center gap-1.5'>
                      <MdEmail size={12} className='text-gray-400' /> {order.userId.email}
                    </p>
                  )}
                  {order.userId?.mobile && (
                    <p className='text-xs text-gray-500 flex items-center gap-1.5'>
                      <FaPhone size={10} className='text-gray-400' /> {order.userId.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address && (
              <div className='bg-white rounded-2xl border p-4'>
                <h3 className='font-bold text-gray-700 text-sm mb-3 flex items-center gap-2'>
                  <FaMapMarkerAlt className='text-red-500' size={13} /> Delivery Address
                </h3>
                <div className='bg-blue-50 rounded-xl p-3'>
                  <p className='text-sm text-gray-700 leading-relaxed'>
                    {order.delivery_address.address_line}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {[order.delivery_address.city, order.delivery_address.state].filter(Boolean).join(', ')}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {[order.delivery_address.country, order.delivery_address.pincode].filter(Boolean).join(' - ')}
                  </p>
                  {order.delivery_address.mobile && (
                    <p className='text-xs text-gray-500 mt-1.5 flex items-center gap-1'>
                      <FaPhone size={9} /> {order.delivery_address.mobile}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className='bg-white rounded-2xl border p-4'>
              <h3 className='font-bold text-gray-700 text-sm mb-3 flex items-center gap-2'>
                <FaBoxOpen className='text-green-600' size={14} /> Items Ordered
                <span className='text-xs font-normal text-gray-400'>
                  ({(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} items)
                </span>
              </h3>
              <div className='space-y-2'>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className='flex items-center gap-3 bg-gray-50 rounded-xl p-2.5'>
                    <div className='w-12 h-12 rounded-lg border bg-white flex-shrink-0 p-0.5 overflow-hidden'>
                      <img src={item.product_details?.image?.[0]} alt='' className='w-full h-full object-contain' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-gray-700 line-clamp-1'>{item.product_details?.name}</p>
                      <p className='text-[10px] text-gray-400 mt-0.5'>Qty: {item.quantity || 1}</p>
                    </div>
                    <p className='text-sm font-bold text-gray-700 flex-shrink-0'>
                      {DisplayPriceInRupees((item.price || 0) * (item.quantity || 1))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Pricing */}
            <div className='bg-white rounded-2xl border p-4'>
              <h3 className='font-bold text-gray-700 text-sm mb-3 flex items-center gap-2'>
                <FaCreditCard className='text-green-500' size={13} /> Payment & Pricing
              </h3>
              <div className='space-y-2.5'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-gray-500'>Method</span>
                  <PaymentBadge status={order.payment_status} />
                </div>
                {order.paymentId && (
                  <div className='flex justify-between items-start gap-2'>
                    <span className='text-xs text-gray-500 flex-shrink-0'>Transaction ID</span>
                    <span className='text-[11px] font-mono text-gray-600 text-right break-all max-w-[200px]'>{order.paymentId}</span>
                  </div>
                )}
                <div className='border-t pt-2.5 space-y-1.5'>
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>Subtotal</span><span>{DisplayPriceInRupees(order.subTotalAmt)}</span>
                  </div>
                  {order.couponCode && order.couponDiscount > 0 && (
                    <div className='flex justify-between text-xs text-green-600 font-medium'>
                      <span className='flex items-center gap-1'>
                        <FaTag size={9} />
                        Coupon
                        <span className='font-mono bg-green-50 border border-green-200 px-1 rounded text-[10px]'>{order.couponCode}</span>
                      </span>
                      <span>- {DisplayPriceInRupees(order.couponDiscount)}</span>
                    </div>
                  )}
                  {order.walletDeduction > 0 && (
                    <div className='flex justify-between text-xs text-blue-600 font-medium'>
                      <span className='flex items-center gap-1'>
                        <FaTag size={9} />Wallet used
                      </span>
                      <span>- {DisplayPriceInRupees(order.walletDeduction)}</span>
                    </div>
                  )}
                  {!order.couponCode && !order.walletDeduction && order.discountAmt > 0 && (
                    <div className='flex justify-between text-xs text-green-600 font-medium'>
                      <span className='flex items-center gap-1'><FaTag size={9} />Discount</span>
                      <span>- {DisplayPriceInRupees(order.discountAmt)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-xs text-green-600 font-medium'>
                    <span>Delivery</span><span>FREE</span>
                  </div>
                  <div className='flex justify-between font-bold text-gray-800 pt-1 border-t'>
                    <span>Grand Total</span>
                    <span className='text-green-700 text-base'>{DisplayPriceInRupees(order.totalAmt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shiprocket Shipping */}
            <div className='bg-white rounded-2xl border p-4'>
              <h3 className='font-bold text-gray-700 text-sm mb-3 flex items-center gap-2'>
                <FaRocket className='text-orange-500' size={13} /> Shiprocket Delivery
              </h3>
              {order.shiprocketOrderId ? (
                <div className='bg-orange-50 rounded-xl p-3 space-y-1.5'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-2 h-2 rounded-full bg-orange-400'></div>
                    <p className='text-xs font-semibold text-orange-700'>Shipment Created</p>
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span className='text-gray-500'>SR Order ID</span>
                    <span className='font-mono text-gray-700'>{order.shiprocketOrderId}</span>
                  </div>
                  {order.shipmentId && (
                    <div className='flex justify-between text-xs'>
                      <span className='text-gray-500'>Shipment ID</span>
                      <span className='font-mono text-gray-700'>{order.shipmentId}</span>
                    </div>
                  )}
                  {order.awbCode && (
                    <div className='flex justify-between text-xs'>
                      <span className='text-gray-500'>AWB Code</span>
                      <span className='font-mono text-gray-700 font-bold'>{order.awbCode}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className='text-xs text-gray-400 mb-3'>
                    Create a shipment on Shiprocket to assign a courier and generate an AWB tracking number.
                  </p>
                  <button
                    onClick={handleShiprocket}
                    disabled={shipping || ['Delivered', 'Cancelled'].includes(order.orderStatus)}
                    className='w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors'
                  >
                    <FaRocket size={13} />
                    {shipping ? 'Creating Shipment...' : 'Ship with Shiprocket'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Meta */}
            <div className='bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 space-y-1.5'>
              <div className='flex justify-between'>
                <span>Order ID</span>
                <span className='font-mono font-semibold text-gray-700'>{order.orderId}</span>
              </div>
              <div className='flex justify-between'>
                <span>Placed on</span>
                <span className='text-gray-700'>{fmtFull(order.createdAt)}</span>
              </div>
              <div className='flex justify-between'>
                <span>Last updated</span>
                <span className='text-gray-700'>{fmtRel(order.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─────────── ORDER ROW CARD ─────────── */
const OrderRow = ({ order, onClick }) => {
  const items = order?.items || []
  const preview = items[0]?.product_details?.image?.[0]
  const firstName = items[0]?.product_details?.name || 'Order'
  const totalItems = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const cfg = statusConfig[order.orderStatus] || statusConfig['Pending']

  return (
    <div
      onClick={onClick}
      className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer group'
    >
      <div className='p-3 sm:p-4 flex items-center gap-3'>
        {/* Image */}
        <div className='w-14 h-14 sm:w-16 sm:h-16 rounded-xl border bg-gray-50 flex-shrink-0 overflow-hidden p-1'>
          {preview
            ? <img src={preview} alt='' className='w-full h-full object-contain' />
            : <FaBoxOpen className='w-full h-full text-gray-300 p-2' />
          }
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='font-semibold text-gray-800 text-sm line-clamp-1'>
                {items.length === 1 ? firstName : `${firstName} +${items.length - 1}`}
              </p>
              <p className='text-[10px] font-mono text-gray-400'>{order.orderId}</p>
            </div>
            <p className='font-bold text-gray-800 text-sm flex-shrink-0'>{DisplayPriceInRupees(order.totalAmt)}</p>
          </div>

          <div className='flex items-center gap-1.5 text-[10px] text-gray-400 mt-1'>
            <FaUser size={8} />
            <span className='font-medium text-gray-600 truncate max-w-24'>{order.userId?.name || 'Unknown'}</span>
            <span className='text-gray-200'>·</span>
            <MdAccessTime size={10} />
            <span>{fmtRel(order.createdAt)}</span>
            <span className='text-gray-200'>·</span>
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>

          <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
              {order.orderStatus}
            </span>
            <PaymentBadge status={order.payment_status} />
          </div>
        </div>

        <FaChevronRight className='text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0' size={12} />
      </div>
    </div>
  )
}

/* ─────────── MAIN PAGE ─────────── */
const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const fetchOrders = async (p = page, s = filterStatus, q = search) => {
    try {
      setLoading(true)
      const res = await Axios({ ...SummaryApi.getAllOrdersAdmin, data: { page: p, status: s, search: q, limit: 15 } })
      if (res.data.success) {
        setOrders(res.data.data.orders)
        setTotalPages(res.data.data.totalPages)
        setTotalCount(res.data.data.totalCount)
      }
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders(page, filterStatus, search) }, [page, filterStatus])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
    fetchOrders(1, filterStatus, searchInput)
  }

  const handleStatusUpdate = (orderId, status) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o))
  }

  const stats = useMemo(() => ({
    total: totalCount,
    pending: orders.filter(o => o.orderStatus === 'Pending').length,
    active: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)).length,
    revenue: orders.reduce((s, o) => s + (o.totalAmt || 0), 0),
  }), [orders, totalCount])

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Drawer */}
      {selectedOrderId && (
        <OrderDetailDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Sticky Header */}
      <div className='bg-white border-b sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
              <FaBoxOpen className='text-blue-600' size={18} />
            </div>
            <div>
              <h1 className='font-bold text-xl text-gray-800'>Manage Orders</h1>
              <p className='text-xs text-gray-500'>{totalCount} total orders</p>
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-4 gap-2 mb-4'>
            {[
              { label: 'Total', val: stats.total,   color: 'blue' },
              { label: 'Pending', val: stats.pending, color: 'yellow' },
              { label: 'Active',  val: stats.active,  color: 'indigo' },
              { label: 'Revenue', val: DisplayPriceInRupees(stats.revenue), color: 'green', small: true },
            ].map(s => (
              <div key={s.label} className={`bg-${s.color}-50 rounded-xl p-2 text-center`}>
                <p className={`text-[9px] text-${s.color}-400 uppercase tracking-wider font-bold`}>{s.label}</p>
                <p className={`${s.small ? 'text-xs' : 'text-lg'} font-bold text-${s.color}-700 truncate`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className='flex flex-col sm:flex-row gap-2'>
            <form onSubmit={handleSearch} className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder='Search order ID or customer...'
                className='w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500 bg-gray-50'
              />
            </form>
            <div className='relative'>
              <FaFilter className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400' size={10} />
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                className='pl-7 pr-4 py-2 border rounded-lg text-xs bg-gray-50 cursor-pointer focus:outline-none appearance-none'
              >
                <option value='all'>All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className='max-w-4xl mx-auto p-4'>
        {loading ? (
          <div className='space-y-2'>
            {[1,2,3,4,5].map(i => (
              <div key={i} className='bg-white rounded-xl border p-4 animate-pulse flex gap-3'>
                <div className='w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0'></div>
                <div className='flex-1 space-y-2 py-1'>
                  <div className='h-3.5 bg-gray-100 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-100 rounded w-1/2'></div>
                  <div className='h-3 bg-gray-100 rounded w-1/3'></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <FaBoxOpen size={40} className='mb-3' />
            <p className='font-medium text-sm'>No orders found</p>
            <p className='text-xs mt-1'>Try a different filter or search</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {orders.map(order => (
              <OrderRow
                key={order._id}
                order={order}
                onClick={() => setSelectedOrderId(order._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-xs text-gray-500'>Page {page} of {totalPages}</p>
            <div className='flex gap-1'>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'>
                <FaChevronLeft size={10} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded border text-xs font-medium ${pg === page ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50'}`}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className='w-8 h-8 rounded border flex items-center justify-center disabled:opacity-30 hover:bg-gray-50'>
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders
