import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { notificationService } from '../../services/notificationService'
import { toRelativeTime } from '../../utils/relativeTime'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function NotificationsDropdown({ open, onClose, onUnreadCountChange }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!open) return
    setLoading(true)

    notificationService.getMyNotifications()
      .then((data) => {
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        toast.error('Failed to load notifications')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open])

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount)
    }
  }, [onUnreadCountChange, unreadCount])

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, read: true } : item
      )))
    } catch {
      toast.error('Unable to mark notification as read')
    }
  }

  const remove = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setItems((current) => current.filter((item) => item.id !== id))
      toast.success('Notification deleted')
    } catch {
      toast.error('Unable to delete notification')
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markRead(notification.id)
    }

    if (onClose) {
      onClose()
    }

    if (
      notification.type === 'NEW_TICKET_CREATED' ||
      notification.type === 'TICKET_UPDATED' ||
      notification.type === 'COMMENT_ADDED'
    ) {
      navigate('/admin/tickets')
    } else if (
      notification.type === 'NEW_BOOKING_REQUEST' ||
      notification.type === 'BOOKING_APPROVED' ||
      notification.type === 'BOOKING_REJECTED'
    ) {
      navigate('/bookings')
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-14 z-40 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-display text-sm font-bold text-slate-900">Notifications</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2">
            {loading ? (
              <div className="p-4">
                <LoadingSpinner label="Fetching notifications..." />
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                You are all caught up.
              </div>
            ) : null}

            {!loading && items.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`mb-2 cursor-pointer rounded-xl border p-3 transition hover:bg-slate-50 ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50/70 hover:bg-blue-100/70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Bell className="h-3.5 w-3.5" />
                      <span>{notification.type || 'SYSTEM'}</span>
                      <span>•</span>
                      <span>{toRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(notification.id)
                        }}
                        className="rounded-md bg-emerald-500 p-1.5 text-white transition hover:bg-emerald-600"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(notification.id)
                      }}
                      className="soft-delete-icon-button p-1.5"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
