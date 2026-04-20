import { motion } from 'framer-motion'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all w-64">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search operations..." 
              className="bg-transparent text-sm outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setOpenNotifications((current) => !current)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
              aria-label="Open notification center"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
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

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <button className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-inner">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name || 'Campus User'}</p>
              <p className="text-[11px] text-slate-500 mt-1">{user?.email || 'No email available'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
