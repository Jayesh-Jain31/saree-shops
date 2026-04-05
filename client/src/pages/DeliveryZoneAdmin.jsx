import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaTruck, FaPlus, FaTrash, FaEdit, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'
import { MdDeliveryDining } from 'react-icons/md'

const DeliveryZoneAdmin = () => {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [formData, setFormData] = useState({
    zoneName: '',
    pincodes: '',
    estimatedTime: '10-20 min',
    deliveryCharge: 0,
  })

  const fetchZones = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getDeliveryZones })
      if (response.data.success) {
        setZones(response.data.data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const resetForm = () => {
    setFormData({ zoneName: '', pincodes: '', estimatedTime: '10-20 min', deliveryCharge: 0 })
    setEditingZone(null)
    setShowForm(false)
  }

  const handleEdit = (zone) => {
    setEditingZone(zone._id)
    setFormData({
      zoneName: zone.zoneName,
      pincodes: zone.pincodes.join(', '),
      estimatedTime: zone.estimatedTime,
      deliveryCharge: zone.deliveryCharge,
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.zoneName.trim()) {
      toast.error('Zone name is required')
      return
    }

    const pincodeArray = formData.pincodes
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (pincodeArray.length === 0) {
      toast.error('Add at least one pincode')
      return
    }

    try {
      if (editingZone) {
        const response = await Axios({
          ...SummaryApi.updateDeliveryZone,
          data: {
            _id: editingZone,
            zoneName: formData.zoneName,
            pincodes: pincodeArray,
            estimatedTime: formData.estimatedTime,
            deliveryCharge: Number(formData.deliveryCharge),
          }
        })
        if (response.data.success) {
          toast.success('Zone updated')
        }
      } else {
        const response = await Axios({
          ...SummaryApi.createDeliveryZone,
          data: {
            zoneName: formData.zoneName,
            pincodes: pincodeArray,
            estimatedTime: formData.estimatedTime,
            deliveryCharge: Number(formData.deliveryCharge),
          }
        })
        if (response.data.success) {
          toast.success('Zone created')
        }
      }
      resetForm()
      fetchZones()
    } catch (error) {
      toast.error('Failed to save zone')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery zone?')) return
    try {
      const response = await Axios({
        ...SummaryApi.deleteDeliveryZone,
        data: { _id: id }
      })
      if (response.data.success) {
        toast.success('Zone deleted')
        fetchZones()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleToggleActive = async (zone) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateDeliveryZone,
        data: { _id: zone._id, isActive: !zone.isActive }
      })
      if (response.data.success) {
        toast.success(zone.isActive ? 'Zone disabled' : 'Zone enabled')
        fetchZones()
      }
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-3xl mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
              <MdDeliveryDining className='text-green-600' size={20} />
            </div>
            <div>
              <h1 className='font-bold text-xl text-gray-800'>Delivery Zones</h1>
              <p className='text-xs text-gray-500'>Manage pincodes and delivery times</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className='flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors'
          >
            <FaPlus size={12} /> Add Zone
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className='bg-white rounded-xl border p-4 mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='font-bold text-sm text-gray-800'>
                {editingZone ? 'Edit Zone' : 'New Delivery Zone'}
              </h2>
              <button onClick={resetForm} className='text-gray-400 hover:text-gray-600'>
                <FaTimes size={14} />
              </button>
            </div>

            <div className='space-y-3'>
              <div>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>Zone Name</label>
                <input
                  type='text'
                  value={formData.zoneName}
                  onChange={(e) => setFormData({ ...formData, zoneName: e.target.value })}
                  placeholder='e.g. Jodhpur City'
                  className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                />
              </div>

              <div>
                <label className='text-xs font-semibold text-gray-600 mb-1 block'>
                  Pincodes <span className='font-normal text-gray-400'>(comma separated)</span>
                </label>
                <textarea
                  value={formData.pincodes}
                  onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                  placeholder='342001, 342002, 342003, 342005'
                  className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none'
                  rows={3}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Estimated Delivery Time</label>
                  <input
                    type='text'
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder='10-20 min'
                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                  />
                </div>
                <div>
                  <label className='text-xs font-semibold text-gray-600 mb-1 block'>Delivery Charge (₹)</label>
                  <input
                    type='number'
                    value={formData.deliveryCharge}
                    onChange={(e) => setFormData({ ...formData, deliveryCharge: e.target.value })}
                    placeholder='0'
                    className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className='w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors'
              >
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </button>
            </div>
          </div>
        )}

        {/* Zones List */}
        {zones.length === 0 ? (
          <div className='bg-white rounded-xl border p-8 text-center'>
            <FaTruck className='text-gray-200 mx-auto mb-3' size={40} />
            <p className='text-gray-500 text-sm'>No delivery zones configured</p>
            <p className='text-gray-400 text-xs mt-1'>Add zones with pincodes to show delivery estimates to customers</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {zones.map((zone) => (
              <div key={zone._id} className={`bg-white rounded-xl border p-4 ${!zone.isActive ? 'opacity-60' : ''}`}>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    <FaMapMarkerAlt className='text-green-600' size={14} />
                    <h3 className='font-bold text-sm text-gray-800'>{zone.zoneName}</h3>
                    {!zone.isActive && (
                      <span className='text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold'>Disabled</span>
                    )}
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => handleToggleActive(zone)}
                      className={`text-[10px] px-2 py-1 rounded font-semibold ${zone.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {zone.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleEdit(zone)}
                      className='w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    >
                      <FaEdit size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(zone._id)}
                      className='w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50'
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>

                <div className='flex items-center gap-4 mb-2'>
                  <div className='flex items-center gap-1.5'>
                    <FaTruck className='text-green-500' size={12} />
                    <span className='text-xs font-semibold text-green-700'>{zone.estimatedTime}</span>
                  </div>
                  <span className='text-xs text-gray-500'>
                    Delivery: {zone.deliveryCharge === 0 ? <span className='text-green-600 font-semibold'>FREE</span> : `₹${zone.deliveryCharge}`}
                  </span>
                </div>

                <div className='flex flex-wrap gap-1.5'>
                  {zone.pincodes.map((pin, i) => (
                    <span key={i} className='text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono'>
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryZoneAdmin
