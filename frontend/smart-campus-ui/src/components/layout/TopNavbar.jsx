import { motion } from 'framer-motion'
import { Bell, ChevronDown, Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import NotificationsDropdown from '../notifications/NotificationsDropdown'

export default function TopNavbar({ user, onToggleMobileSidebar }) {
  const [openNotifications, setOpenNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const initials = useMemo(() => {
    const source = user?.name || user?.email || 'User'
    return source.charAt(0).toUpperCase()
  }, [user?.email, user?.name])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">Smart Campus Operations Hub</h1>
            <p className="text-xs text-slate-500">Monitor, coordinate, and respond in real time.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setOpenNotifications((current) => !current)}
              className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
              aria-label="Open notification center"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </motion.button>
            <NotificationsDropdown
              open={openNotifications}
              onClose={() => setOpenNotifications(false)}
              onUnreadCountChange={setUnreadCount}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white">
              {initials}
            </span>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{user?.name || 'Campus User'}</p>
              <p className="text-[11px] text-slate-500">{user?.email || 'No email available'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
