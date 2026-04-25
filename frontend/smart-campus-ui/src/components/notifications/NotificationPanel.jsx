import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, CheckCheck, ExternalLink, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toRelativeTime } from '../../utils/relativeTime'

function resolveDestination(notification) {
  const type = notification?.type
  const referenceId = notification?.referenceId

  if (type === 'BOOKING_APPROVED' || type === 'BOOKING_REJECTED' || type === 'NEW_BOOKING_REQUEST') {
    return referenceId ? `/bookings?focus=${referenceId}` : '/bookings'
  }

  if (type === 'TICKET_UPDATED' || type === 'COMMENT_ADDED') {
    return referenceId ? `/tickets?focus=${referenceId}` : '/tickets'
  }

  return '/notifications'
}

function typeLabel(type) {
  if (!type) return 'SYSTEM'
  return type.replaceAll('_', ' ')
}

export default function NotificationPanel({
  open,
  loading,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) {
  const navigate = useNavigate()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, open])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const onNotificationClick = async (notification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id)
    }

    navigate(resolveDestination(notification))
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-14 z-40 w-[370px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Notifications</h3>
              <p className="text-[11px] text-slate-500">{unreadCount} unread</p>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            ) : null}
          </div>

          <div className="max-h-[390px] overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((skeletonItem) => (
                  <div key={skeletonItem} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : null}

            {!loading && notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                You are all caught up.
              </div>
            ) : null}

            {!loading && notifications.map((notification) => (
              <motion.button
                key={notification.id}
                type="button"
                whileHover={{ y: -1 }}
                onClick={() => onNotificationClick(notification)}
                className={`mb-2 w-full rounded-xl border p-3 text-left transition ${notification.read ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-blue-100 bg-blue-50/70 hover:bg-blue-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {notification.message}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 font-semibold text-slate-600">
                        <Bell className="h-3.5 w-3.5" />
                        {typeLabel(notification.type)}
                      </span>
                      <span>{toRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onMarkAsRead(notification.id)
                        }}
                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 transition hover:border-blue-300 hover:text-blue-600"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(notification.id)
                      }}
                      className="soft-delete-icon-button p-1"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
