import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock3, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Tooltip from '../components/ui/Tooltip'
import { notificationService } from '../services/notificationService'
import { toRelativeTime } from '../utils/relativeTime'

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const loadNotifications = () => {
    setLoading(true)
    setError('')

    notificationService.getMyNotifications()
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.error || 'Unable to load notifications right now.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    let active = true

    notificationService.getMyNotifications()
      .then((data) => {
        if (!active) return
        setNotifications(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.response?.data?.error || 'Unable to load notifications right now.')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((current) => current.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      )))
      toast.success('Notification marked as read')
    } catch {
      toast.error('Unable to mark notification as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((current) => current.filter((notification) => notification.id !== id))
      toast.success('Notification deleted')
    } catch {
      toast.error('Unable to delete notification')
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-600">Track updates, alerts, and operational messages.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <Bell className="h-4 w-4" />
            {unreadCount} unread
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </section>
      ) : null}

      {loading ? (
        <section className="glass-panel p-6">
          <LoadingSpinner label="Loading notifications..." />
        </section>
      ) : null}

      {!loading && notifications.length === 0 ? (
        <EmptyState
          title="You have no notifications"
          description="New updates on bookings, tickets, and campus actions will appear here."
          action={(
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          )}
        />
      ) : null}

      {!loading && notifications.length > 0 ? (
        <section className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.article
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`glass-panel p-4 ${notification.read ? 'opacity-90' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {notification.message}
                    </span>
                    {!notification.read ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Read
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                      {notification.type || 'SYSTEM'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {toRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!notification.read ? (
                    <Tooltip text="Mark this notification as read">
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="rounded-lg bg-emerald-500 p-2 text-white transition hover:bg-emerald-600"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  ) : null}

                  <Tooltip text="Delete this notification">
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="rounded-lg bg-rose-500 p-2 text-white transition hover:bg-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ) : null}
    </div>
  )
}