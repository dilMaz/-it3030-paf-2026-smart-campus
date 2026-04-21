import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock3, Inbox, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
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

    notificationService.getNotifications()
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

    notificationService.getNotifications()
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

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    try {
      await notificationService.markAllAsRead()
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Unable to mark all as read')
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <section className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
            <p className="text-sm text-slate-500 mt-1">Track updates, alerts, and operational messages.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-blue-50/50 px-4 py-2.5 text-sm font-semibold text-blue-700 border border-blue-100">
            <span className="relative flex h-2 w-2">
              {unreadCount > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${unreadCount > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
            </span>
            {unreadCount} unread
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition hover:bg-slate-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm border border-rose-200 hover:bg-rose-100 transition"
          >
            Retry
          </button>
        </section>
      ) : null}

      {loading ? (
        <section className="space-y-4">
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
          <Skeleton variant="rectangular" className="h-24 w-full" />
        </section>
      ) : null}

      {!loading && notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox Zero"
          description="You're all caught up! New updates on bookings, tickets, and campus actions will appear here."
          action={(
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Refresh Inbox
            </button>
          )}
        />
      ) : null}

      {!loading && notifications.length > 0 ? (
        <section className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.article
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50/30'}`}
            >
              {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />}
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1 pl-2">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className={`text-base ${notification.read ? 'text-slate-600' : 'font-bold text-slate-900'}`}>
                      {notification.message}
                    </span>
                    {!notification.read ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        New
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                      {notification.type || 'SYSTEM'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {toRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {!notification.read ? (
                    <Tooltip text="Mark as read">
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 shadow-sm transition hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <CheckCheck className="h-4.5 w-4.5" />
                      </button>
                    </Tooltip>
                  ) : null}
                  <Tooltip text="Delete">
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 shadow-sm transition hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
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