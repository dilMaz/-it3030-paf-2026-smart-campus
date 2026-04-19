import { motion } from 'framer-motion'
import {
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Ticket,
  UserCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const menuByRole = {
  USER: ['Dashboard', 'Facilities', 'Bookings', 'Tickets', 'Notifications', 'Profile'],
  ADMIN: ['Dashboard', 'Facilities', 'Bookings', 'Tickets', 'Notifications', 'Profile'],
  TECHNICIAN: ['Dashboard', 'Tickets', 'Notifications'],
}

const items = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Facilities', to: '/facilities', icon: Building2 },
  { label: 'Bookings', to: '/bookings', icon: CalendarDays },
  { label: 'Tickets', to: '/tickets', icon: Ticket },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Profile', to: '/profile', icon: UserCircle },
]

export default function Sidebar({ role = 'USER', onLogout, onNavigate, mobile = false }) {
  const visibleLabels = menuByRole[role] || menuByRole.USER
  const visibleItems = items.filter((item) => visibleLabels.includes(item.label))

  return (
    <aside className={`${mobile ? 'flex w-full' : 'hidden w-72 lg:flex'} flex-col border-r border-white/20 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 px-4 py-6 text-white`}>
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display text-lg font-bold">Campus Hub</p>
          <p className="text-xs text-blue-100">Operations Workspace</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => [
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
              isActive
                ? 'bg-white/25 font-semibold shadow-lg'
                : 'text-blue-50 hover:bg-white/15 hover:text-white',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/20 pt-4">
        <motion.button
          whileHover={{ x: 3 }}
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100 transition hover:bg-white/15 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  )
}
