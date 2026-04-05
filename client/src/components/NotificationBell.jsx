import React, { useEffect, useState, useRef } from 'react'
import { FaBell } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'

const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('notifications') || '[]')
  } catch { return [] }
}

const saveNotifications = (notifs) => {
  localStorage.setItem('notifications', JSON.stringify(notifs.slice(0, 20)))
}

export const addNotification = (message, type = 'info') => {
  const notifs = getNotifications()
  notifs.unshift({
    id: Date.now(),
    message,
    type,
    read: false,
    time: new Date().toISOString(),
  })
  saveNotifications(notifs)
  window.dispatchEvent(new Event('notification-update'))
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const ref = useRef(null)

  const refresh = () => setNotifications(getNotifications())

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('notification-update', handler)
    return () => window.removeEventListener('notification-update', handler)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
    setNotifications(updated)
  }

  const clearAll = () => {
    saveNotifications([])
    setNotifications([])
  }

  const removeOne = (id) => {
    const updated = notifications.filter(n => n.id !== id)
    saveNotifications(updated)
    setNotifications(updated)
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = (now - d) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const typeColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }

  return (
    <div className='relative' ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead() }}
        className='relative p-2 rounded-lg hover:bg-gray-100 transition-colors'
      >
        <FaBell size={18} className='text-gray-600' />
        {unread > 0 && (
          <span className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-11 w-72 sm:w-80 bg-white border rounded-xl shadow-xl z-50 overflow-hidden'>
          <div className='p-3 border-b flex items-center justify-between'>
            <h3 className='font-bold text-sm text-gray-800'>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={clearAll} className='text-[11px] text-gray-400 hover:text-red-500'>
                Clear all
              </button>
            )}
          </div>

          <div className='max-h-72 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='p-6 text-center'>
                <FaBell className='text-gray-200 mx-auto mb-2' size={24} />
                <p className='text-xs text-gray-400'>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-0 flex gap-2 items-start ${!n.read ? 'bg-green-50/30' : ''}`}
                >
                  <div className='flex-1 min-w-0'>
                    <p className={`text-xs leading-snug border rounded-lg px-2 py-1 ${typeColors[n.type] || typeColors.info}`}>
                      {n.message}
                    </p>
                    <p className='text-[10px] text-gray-400 mt-1'>{formatTime(n.time)}</p>
                  </div>
                  <button
                    onClick={() => removeOne(n.id)}
                    className='text-gray-300 hover:text-red-400 mt-0.5 flex-shrink-0'
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
