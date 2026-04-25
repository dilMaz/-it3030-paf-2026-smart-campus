import { ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import NotificationBell from '../notifications/NotificationBell'
import { API_BASE_URL } from '../../config/env'
import { useAuth } from '../../hooks/useAuth'

export default function TopNavbar({ user, onToggleMobileSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { logout } = useAuth()
  const dropdownRef = useRef(null)

  const initials = useMemo(() => {
    const source = user?.name || user?.email || 'User'
    return source.charAt(0).toUpperCase()
  }, [user?.email, user?.name])

  const avatarUrl = useMemo(() => {
    const imageUrl = user?.profileImageUrl || user?.picture
    if (!imageUrl) return ''
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl
    return `${API_BASE_URL}${imageUrl}`
  }, [user?.picture, user?.profileImageUrl])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
          <NotificationBell />

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="relative" ref={dropdownRef}>
            <button 
              className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="User avatar" className="h-9 w-9 rounded-lg object-cover shadow-inner" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-inner">
                  {initials}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name || 'Campus User'}</p>
                <p className="text-[11px] text-slate-500 mt-1">{user?.email || 'No email available'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* User profile dropdown menu with sign out option */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User avatar" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user?.name || 'Campus User'}</p>
                      <p className="text-xs text-slate-500">{user?.email || 'No email available'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
