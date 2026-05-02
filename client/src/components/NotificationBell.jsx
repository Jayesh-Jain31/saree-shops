import React, { useEffect, useState, useRef, useCallback } from 'react'
import { FaBell } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

const TYPE_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

const TYPE_DOT = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
}

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d) / 1000
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const NotificationBell = () => {
  const user = useSelector(state => state.user)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const pollRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return
    try {
      const res = await Axios({
        ...SummaryApi.getMyNotifications,
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || [])
        setUnread(res.data.data.unreadCount || 0)
      }
    } catch {}
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) return
    fetchNotifications()
    pollRef.current = setInterval(fetchNotifications, 30000)
    return () => clearInterval(pollRef.current)
  }, [user?._id, fetchNotifications])

  useEffect(() => {
    const handleFocus = () => { if (user?._id) fetchNotifications() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?._id, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setOpen(prev => !prev)
    if (!open && unread > 0) {
      try {
        await Axios({ ...SummaryApi.markAllNotificationsRead })
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnread(0)
      } catch {}
    }
  }

  const handleClick = async (n) => {
    try {
      await Axios({ url: `${SummaryApi.markNotificationRead.url}/${n._id}`, method: 'put' })
    } catch {}
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await Axios({ url: `${SummaryApi.deleteNotification.url}/${id}`, method: 'delete' })
      setNotifications(prev => prev.filter(n => n._id !== id))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleClearAll = async () => {
    setLoading(true)
    try {
      await Axios({ ...SummaryApi.clearAllNotifications })
      setNotifications([])
      setUnread(0)
    } catch {}
    setLoading(false)
  }

  if (!user?._id) return null

  return (
    <div className='relative' ref={ref}>
      <button
        onClick={handleOpen}
        className='relative p-2 rounded-lg hover:bg-gray-100 transition-colors'
        aria-label='Notifications'
      >
        <FaBell size={18} className={unread > 0 ? 'text-primary-200' : 'text-gray-500'} />
        {unread > 0 && (
          <span className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-11 w-[calc(100vw-24px)] max-w-xs sm:max-w-sm bg-white border rounded-xl shadow-2xl z-50 overflow-hidden'>
          {/* Header */}
          <div className='px-4 py-3 border-b flex items-center justify-between bg-gray-50'>
            <div className='flex items-center gap-2'>
              <FaBell size={13} className='text-gray-500' />
              <h3 className='font-bold text-sm text-gray-800'>Notifications</h3>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={loading}
                className='text-[11px] text-gray-400 hover:text-red-500 transition-colors'
              >
                {loading ? 'Clearing...' : 'Clear all'}
              </button>
            )}
          </div>

          {/* List */}
          <div className='max-h-80 overflow-y-auto divide-y divide-gray-50'>
            {notifications.length === 0 ? (
              <div className='p-8 text-center'>
                <FaBell className='text-gray-200 mx-auto mb-2' size={28} />
                <p className='text-sm font-medium text-gray-400'>You're all caught up!</p>
                <p className='text-xs text-gray-300 mt-1'>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 flex gap-3 items-start cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[n.type] || TYPE_DOT.info} ${!n.read ? 'opacity-100' : 'opacity-0'}`} />
                  <div className='flex-1 min-w-0'>
                    <p className={`text-xs leading-snug rounded-lg px-2.5 py-1.5 border ${TYPE_STYLES[n.type] || TYPE_STYLES.info}`}>
                      {n.message}
                    </p>
                    <p className='text-[10px] text-gray-400 mt-1 ml-0.5'>{formatTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n._id)}
                    className='text-gray-300 hover:text-red-400 mt-1 flex-shrink-0 transition-colors'
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='px-4 py-2 border-t bg-gray-50 text-center'>
              <p className='text-[10px] text-gray-400'>{notifications.length} notification{notifications.length !== 1 ? 's' : ''} · updates every 30s</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
