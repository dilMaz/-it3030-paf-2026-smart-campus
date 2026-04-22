import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock3, Inbox, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { notificationService } from '../services/notificationService'
import { toRelativeTime } from '../utils/relativeTime'

const PREFERENCE_STORAGE_KEY = 'notification-preferences'

const preferenceDefinitions = [
  {
    id: 'booking_updates',
    title: 'Booking approval/rejection',
    detail: 'Booking workflow updates',
  },
  {
    id: 'ticket_updates',
    title: 'Ticket status changes',
    detail: 'When ticket state is updated',
  },
  {
    id: 'ticket_comments',
    title: 'New comments on your tickets',
    detail: 'When someone comments on your ticket',
  },
]

function getSavedPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY) || 'null')
    if (!value || typeof value !== 'object') {
      return Object.fromEntries(preferenceDefinitions.map((item) => [item.id, true]))
    }

    return Object.fromEntries(
      preferenceDefinitions.map((item) => [item.id, typeof value[item.id] === 'boolean' ? value[item.id] : true]),
    )
  } catch {
    return Object.fromEntries(preferenceDefinitions.map((item) => [item.id, true]))
  }
}

function typeLabel(type) {
  if (!type) return 'System'
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function NotificationsPage() {
  const { roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [preferences, setPreferences] = useState(getSavedPreferences)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const readCount = notifications.length - unreadCount
  const currentRole = roles[0] || 'USER'

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((notification) => !notification.read)
    }
    if (activeFilter === 'read') {
      return notifications.filter((notification) => notification.read)
    }
    return notifications
  }, [activeFilter, notifications])

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
    loadNotifications()
  }, [])

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

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
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
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
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(248,250,252,0.84))] p-5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
        <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">Notifications</h2>
        <p className="mt-4 text-base text-slate-600">Keep track of booking decisions, ticket updates, and comments.</p>
        <p className="mt-4 text-2xl font-semibold uppercase tracking-wide text-slate-700">{currentRole}</p>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(241,245,249,0.78))] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-7">
        <h3 className="text-[15px] font-bold tracking-tight text-slate-800 sm:text-base">Notification Preferences</h3>
        <div className="mt-5 space-y-3">
          {preferenceDefinitions.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <div>
                <p className="text-sm font-semibold leading-5 text-slate-700 sm:text-[15px]">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-[13px]">{item.detail}</p>
              </div>
              <button
                type="button"
                aria-pressed={preferences[item.id]}
                onClick={() => setPreferences((current) => ({ ...current, [item.id]: !current[item.id] }))}
                className={[
                  'relative h-7 w-12 rounded-full border transition-all duration-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]',
                  preferences[item.id]
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-slate-300 bg-slate-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full border border-white/90 bg-white shadow-[0_4px_10px_rgba(15,23,42,0.18)] transition-transform duration-200',
                    preferences[item.id] ? 'translate-x-6' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-slate-500 sm:text-sm">Changes apply immediately.</p>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(241,245,249,0.78))] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">Unread: {unreadCount}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl text-slate-500">Read: {readCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadNotifications}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white/85 text-slate-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              activeFilter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white/85 text-slate-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('read')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              activeFilter === 'read'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white/85 text-slate-600'
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {error ? (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <section className="mt-8 space-y-3">
            <Skeleton variant="rectangular" className="h-24 w-full rounded-2xl" />
            <Skeleton variant="rectangular" className="h-24 w-full rounded-2xl" />
            <Skeleton variant="rectangular" className="h-24 w-full rounded-2xl" />
          </section>
        ) : null}

        {!loading && notifications.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Inbox}
              title="Inbox Zero"
              description="You're all caught up! New updates on bookings, tickets, and campus actions will appear here."
            />
          </div>
        ) : null}

        {!loading && notifications.length > 0 ? (
          <section className="mt-8 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-base text-slate-500">No notifications in this filter.</div>
            ) : null}

            {filteredNotifications.map((notification, index) => (
              <motion.article
                key={notification.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-2xl border px-4 py-4 shadow-sm transition hover:shadow-md ${
                  notification.read
                    ? 'border-slate-200 bg-white/80'
                    : 'border-blue-100 bg-blue-50/70'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${notification.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <span className={`text-base ${notification.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
                        {notification.message}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 pl-11 text-xs text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                        {typeLabel(notification.type)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {toRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </section>
        ) : null}
      </section>
    </div>
  )
}
