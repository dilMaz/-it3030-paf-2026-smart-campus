import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'

function getPrimaryRole(roles = []) {
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('TECHNICIAN')) return 'TECHNICIAN'
  return 'USER'
}

export default function AppShell() {
  const { user, roles, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const role = useMemo(() => getPrimaryRole(roles), [roles])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(147,51,234,0.18),_transparent_35%),#f7f9fc] font-body text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar role={role} onLogout={handleLogout} />

        <AnimatePresence>
          {mobileSidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            >
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                className="h-full w-72 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 p-4"
              >
                <div className="mb-4 flex justify-end">
                  <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <Sidebar
                  role={role}
                  onLogout={handleLogout}
                  onNavigate={() => setMobileSidebarOpen(false)}
                  mobile
                />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar user={user} onToggleMobileSidebar={() => setMobileSidebarOpen((state) => !state)} />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex-1 px-4 py-5 lg:px-8"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
