import { motion } from 'framer-motion'
import { Bell, CalendarDays, ChevronRight, ClipboardList, Clock, Ticket, Users, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { notificationService } from '../services/notificationService'
import { toRelativeTime } from '../utils/relativeTime'

const allStats = [
  { icon: Users, label: 'Active users', value: '1,284', tone: 'info', roles: ['ADMIN'] },
  { icon: CalendarDays, label: 'Active bookings', value: '42', tone: 'pending', roles: ['ADMIN', 'USER'] },
  { icon: Ticket, label: 'Open tickets', value: '18', tone: 'error', roles: ['ADMIN', 'TECHNICIAN'] },
  { icon: Bell, label: 'Unread alerts', value: '7', tone: 'success', roles: ['ADMIN', 'USER', 'TECHNICIAN'] },
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-500/20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 translate-y-1/3 -translate-x-1/3 rounded-full bg-purple-500/20 blur-[80px]" />
        
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Overview</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Welcome back, {user?.name || user?.email || 'Campus User'}</h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            You are signed in as <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md">{role}</span>. Here is what is happening across the campus today.
          </p>
        </div>
      </motion.section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Summary</h3>
            <p className="text-sm text-slate-500">Quick snapshot of today&apos;s operations.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleStats.map((stat, i) => (
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="glass-panel relative overflow-hidden p-5 group"
            >
              <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110">
                <stat.icon className="h-24 w-24" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <div className={`rounded-lg p-2 ${stat.tone === 'info' ? 'bg-blue-50 text-blue-600' : stat.tone === 'pending' ? 'bg-amber-50 text-amber-600' : stat.tone === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-4xl font-black tracking-tight text-slate-900 relative z-10">{stat.value}</p>
              <div className="mt-4 relative z-10">
                <StatusBadge tone={stat.tone}>Live Data</StatusBadge>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {role === 'ADMIN' ? (
          <article className="glass-panel p-6 xl:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-display text-lg font-bold text-blue-900">Administrator Actions</h4>
                <p className="text-sm text-blue-700">Manage system users, permissions, and top-level organizational controls.</p>
              </div>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                Manage Users <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ) : null}

        {(role === 'ADMIN' || role === 'USER') ? (
          <article className="glass-panel flex flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                   <CalendarDays className="h-5 w-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-slate-900">Recent Bookings</h4>
              </div>
              <Link to="/bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            
            <div className="flex-1 space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="group relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-slate-900">{booking.room}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{booking.time}</span>
                    </div>
                  </div>
                  <StatusBadge tone={statusTone(booking.status)}>{booking.status}</StatusBadge>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {(role === 'ADMIN' || role === 'TECHNICIAN') ? (
          <article className="glass-panel flex flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                   <Wrench className="h-5 w-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-slate-900">Recent Tickets</h4>
              </div>
              <Link to="/tickets" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            
            <div className="flex-1 space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="group relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.location}</p>
                  </div>
                  <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="glass-panel flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                 <ClipboardList className="h-5 w-5" />
              </div>
              <h4 className="font-display text-lg font-bold text-slate-900">Notifications</h4>
            </div>
            <Link to="/notifications" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton variant="rectangular" className="h-20 w-full" />
                <Skeleton variant="rectangular" className="h-20 w-full" />
                <Skeleton variant="rectangular" className="h-20 w-full" />
              </div>
            ) : null}

            {!loading && previewNotifications.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Bell className="mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">All caught up</p>
                <p className="mt-1 text-xs text-slate-500">No new notifications to show.</p>
              </div>
            ) : null}

            {!loading && previewNotifications.length > 0 ? (
              <div className="space-y-3">
                {previewNotifications.map((notification) => (
                  <div key={notification.id} className={`relative flex flex-col justify-center rounded-2xl border p-4 transition-all hover:shadow-sm ${notification.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/50'}`}>
                    {!notification.read && <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />}
                    <p className={`text-sm leading-relaxed ${notification.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {notification.message}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{toRelativeTime(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  )
}