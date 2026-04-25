import { motion } from 'framer-motion'
import {
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Ticket,
  UserCircle,
  Shield,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const menuByRole = {
  USER: ['Dashboard', 'Facilities', 'Bookings', 'Tickets', 'Notifications', 'Profile'],
  ADMIN: ['Dashboard', 'Admin', 'Facilities', 'Bookings', 'Tickets', 'Notifications', 'Profile'],
  TECHNICIAN: ['Dashboard', 'Tickets', 'Notifications', 'Profile'],
}

const items = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Admin', to: '/admin/dashboard', icon: Shield },
  { label: 'Facilities', to: '/facilities', icon: Building2 },
  { label: 'Bookings', to: '/bookings', icon: CalendarDays },
  { label: 'Tickets', to: '/tickets', icon: Ticket },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Profile', to: '/profile', icon: UserCircle },
]

export default function Sidebar({ role = 'USER', onLogout, onNavigate, mobile = false }) {
  const visibleLabels = menuByRole[role] || menuByRole.USER
  const visibleItems = items.filter((item) => visibleLabels.includes(item.label))

  // Sidebar expands on hover/focus, otherwise only icons are shown
  return (
    <aside
      className={`
        ${mobile ? 'flex w-full' : 'hidden lg:flex'}
        flex-col border-r border-slate-800 bg-slate-900 py-8 text-white relative overflow-hidden
        group/sidebar transition-all duration-300
        w-20 hover:w-72 focus-within:w-72
      `}
      tabIndex={0}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 -left-10 h-64 w-64 rounded-full bg-blue-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 -right-10 h-64 w-64 rounded-full bg-purple-600/20 blur-[80px] pointer-events-none" />

      <div className="relative mb-10 flex flex-col items-center gap-3 px-2 transition-all duration-300 group-hover/sidebar:items-start group-focus-within:items-start">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
          <img
            src="/westford-university-logo.svg"
            alt="Westford University logo"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="hidden group-hover/sidebar:block group-focus-within:block text-left">
          <p className="font-display text-lg font-bold tracking-wide">Westford University</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operations Center</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => [
              'group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05)] ring-1 ring-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                )}
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="hidden group-hover/sidebar:inline group-focus-within:inline transition-all duration-200">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative mt-auto pt-6">
        <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-1 hover:ring-rose-500/30"
        >
          <LogOut className="h-5 w-5 text-slate-500 transition-colors group-hover:text-rose-400" />
          <span className="hidden group-hover/sidebar:inline group-focus-within:inline transition-all duration-200">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
