import { motion } from 'framer-motion'
import { Bell, CalendarDays, ClipboardList, Ticket, Users, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { notificationService } from '../services/notificationService'
import { toRelativeTime } from '../utils/relativeTime'

const allStats = [
  { icon: Users, label: 'Active users', value: '1,284', tone: 'info', roles: ['ADMIN'] },
  { icon: CalendarDays, label: 'Active bookings', value: '42', tone: 'pending', roles: ['ADMIN', 'USER'] },
  { icon: Ticket, label: 'Open tickets', value: '18', tone: 'error', roles: ['ADMIN', 'TECHNICIAN'] },
  { icon: Bell, label: 'Unread notifications', value: '7', tone: 'success', roles: ['ADMIN', 'USER', 'TECHNICIAN'] },
]

const recentBookings = [
  { id: 1, room: 'Lecture Hall A', time: 'Today, 09:00-11:00', status: 'APPROVED' },
  { id: 2, room: 'Lab 3', time: 'Tomorrow, 13:00-15:00', status: 'PENDING' },
  { id: 3, room: 'Meeting Room 2', time: 'Mon, 10:00-12:00', status: 'REJECTED' },
]

const recentTickets = [
  { id: 1, title: 'Projector not working', location: 'Hall B', status: 'OPEN' },
  { id: 2, title: 'AC malfunction', location: 'Lab 1', status: 'IN_PROGRESS' },
  { id: 3, title: 'Door lock broken', location: 'Room 204', status: 'RESOLVED' },
]

function statusTone(status) {
  if (['APPROVED', 'RESOLVED'].includes(status)) return 'success'
  if (['PENDING', 'IN_PROGRESS'].includes(status)) return 'pending'
  if (['REJECTED', 'OPEN'].includes(status)) return 'error'
  return 'info'
}

export default function Dashboard() {
  const { user, roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [previewNotifications, setPreviewNotifications] = useState([])

  const role = useMemo(() => {
    if (roles.includes('ADMIN')) return 'ADMIN'
    if (roles.includes('TECHNICIAN')) return 'TECHNICIAN'
    return 'USER'
  }, [roles])

  const visibleStats = useMemo(
    () => allStats.filter((stat) => stat.roles.includes(role)),
    [role],
  )

  useEffect(() => {
    let active = true

    notificationService.getMyNotifications()
      .then((items) => {
        if (!active) return
        const sorted = Array.isArray(items) ? items : []
        setPreviewNotifications(sorted.slice(0, 3))
      })
      .catch(() => {
        if (!active) return
        setPreviewNotifications([])
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

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-soft"
      >
        <p className="text-sm text-blue-100">Overview</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Welcome back, {user?.name || user?.email || 'Campus User'}</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          You are signed in as <span className="font-semibold">{role}</span>. Focus on critical updates and actions below.
        </p>
      </motion.section>

      <section>
        <h3 className="font-display text-xl font-bold text-slate-900">Summary</h3>
        <p className="text-sm text-slate-600">Quick snapshot of today&apos;s operations.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleStats.map((stat) => (
            <motion.article
              key={stat.label}
              whileHover={{ y: -3 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-slate-500" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">{stat.value}</p>
              <div className="mt-2">
                <StatusBadge tone={stat.tone}>Live</StatusBadge>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {role === 'ADMIN' ? (
          <article className="glass-panel p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-lg font-bold text-slate-900">Administrator Actions</h4>
                <p className="text-sm text-slate-600">Manage users, permissions, and system-level controls.</p>
              </div>
              <Link
                to="/admin/users"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open User Role Management
              </Link>
            </div>
          </article>
        ) : null}

        {(role === 'ADMIN' || role === 'USER') ? (
          <article className="glass-panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
              <h4 className="font-display text-lg font-bold text-slate-900">Recent Bookings</h4>
            </div>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{booking.room}</p>
                      <p className="text-xs text-slate-500">{booking.time}</p>
                    </div>
                    <StatusBadge tone={statusTone(booking.status)}>{booking.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {(role === 'ADMIN' || role === 'TECHNICIAN') ? (
          <article className="glass-panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4.5 w-4.5 text-blue-600" />
              <h4 className="font-display text-lg font-bold text-slate-900">Recent Tickets</h4>
            </div>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                      <p className="text-xs text-slate-500">{ticket.location}</p>
                    </div>
                    <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="glass-panel p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
              <h4 className="font-display text-lg font-bold text-slate-900">Notification Preview</h4>
            </div>
            <Link to="/notifications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Loading notifications...</p>
          ) : null}

          {!loading && previewNotifications.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No notifications yet.</p>
          ) : null}

          {!loading && previewNotifications.length > 0 ? (
            <div className="space-y-2">
              {previewNotifications.map((notification) => (
                <div key={notification.id} className={`rounded-xl border p-3 ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50/70'}`}>
                  <p className={`text-sm ${notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{toRelativeTime(notification.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  )
}