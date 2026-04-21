import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { notificationService } from '../../services/notificationService'
import NotificationPanel from './NotificationPanel'

const POLLING_INTERVAL_MS = 5000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await notificationService.getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      if (!silent) {
        toast.error('Failed to load notifications')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadNotifications({ silent: true })

    const interval = setInterval(() => {
      loadNotifications({ silent: true })
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const markAsRead = async (id) => {
    try {
      const updated = await notificationService.markAsRead(id)
      setNotifications((current) => current.map((item) => (
        item.id === id ? { ...item, ...updated } : item
      )))
    } catch {
      toast.error('Unable to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return
    }

    try {
      await notificationService.markAllAsRead()
      setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Unable to mark all notifications as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((current) => current.filter((item) => item.id !== id))
      toast.success('Notification deleted')
    } catch {
      toast.error('Unable to delete notification')
    }
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
        aria-label="Open notification center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </motion.button>

      <NotificationPanel
        open={open}
        loading={loading}
        notifications={notifications}
        onClose={() => setOpen(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />
    </div>
  )
}
