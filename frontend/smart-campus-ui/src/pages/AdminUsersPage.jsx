import { motion } from 'framer-motion'
import { Check, ChevronDown, Search, ShieldCheck, UserCog, Filter, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import { AUTH_USER_STORAGE_KEY } from '../constants/authStorage'
import api from '../services/api'

const roleOptions = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER']
const TECHNICIAN_TYPE_STORAGE_KEY = 'smartCampusTechnicianTypes'

function loadTechnicianTypes() {
  try {
    const stored = JSON.parse(localStorage.getItem(TECHNICIAN_TYPE_STORAGE_KEY) || '[]')
    return Array.isArray(stored) ? stored.filter((value) => typeof value === 'string' && value.trim()) : []
  } catch {
    return []
  }
}

function saveTechnicianType(value) {
  const next = String(value || '').trim()
  if (!next) return

  const existing = loadTechnicianTypes()
  const normalized = next.toLowerCase()
  const withoutDupes = existing.filter((item) => item.toLowerCase() !== normalized)
  const merged = [next, ...withoutDupes].slice(0, 15)
  localStorage.setItem(TECHNICIAN_TYPE_STORAGE_KEY, JSON.stringify(merged))
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [technicianTypes, setTechnicianTypes] = useState(() => loadTechnicianTypes())
  const [technicianModal, setTechnicianModal] = useState({ open: false, userId: '', role: 'TECHNICIAN', value: '' })

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_STORAGE_KEY) || 'null')
    } catch {
      return null
    }
  }, [])

  const fetchUsers = () => {
    setLoading(true)
    setError('')
    api.get('/api/auth/users')
      .then((response) => {
        setUsers(response.data)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.error || 'Unable to load users list right now.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    let active = true

    api.get('/api/auth/users')
      .then((response) => {
        if (!active) return
        setUsers(response.data)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError?.response?.data?.error || 'Unable to load users list right now.')
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

  const requestRoleUpdate = (userId, payload) => {
    setSavingUserId(userId)
    setError('')

    api.patch(`/api/auth/users/${userId}/role`, payload)
      .then((response) => {
        setUsers((current) => current.map((u) => (
          u.id === userId ? response.data : u
        )))
        toast.success(`Role updated to ${payload.role}`)
      })
      .catch((requestError) => {
        const errorMsg = requestError?.response?.data?.error || requestError?.response?.data?.message || 'Unable to update user role.'
        setError(errorMsg)
        toast.error(errorMsg)
      })
      .finally(() => {
        setSavingUserId('')
      })
  }

  const updateRole = (userId, newRole) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const currentRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
    if (currentRole === newRole) return

    if (newRole === 'TECHNICIAN') {
      setTechnicianModal({
        open: true,
        userId,
        role: newRole,
        value: user.technicianType || '',
      })
      return
    }

    requestRoleUpdate(userId, { role: newRole })
  }

  const confirmTechnicianType = () => {
    const value = technicianModal.value.trim()
    if (!value) {
      setError('Technician type is required.')
      toast.error('Technician type is required.')
      return
    }

    saveTechnicianType(value)
    setTechnicianTypes(loadTechnicianTypes())
    requestRoleUpdate(technicianModal.userId, { role: 'TECHNICIAN', technicianType: value })
    setTechnicianModal({ open: false, userId: '', role: 'TECHNICIAN', value: '' })
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    return users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [users, searchQuery])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Admin Control Center
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="mt-1 text-sm text-slate-500">Assign permissions, manage roles, and audit system access.</p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="glass-panel overflow-hidden p-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 bg-white/50 p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">User Identity</th>
                <th className="px-6 py-4 font-bold">Contact Email</th>
                <th className="px-6 py-4 font-bold">Current Role</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-10 w-32 ml-auto" /></td>
                  </tr>
                ))
              ) : null}

              {!loading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="font-semibold text-slate-700">No users found.</p>
                      <p className="text-sm">Try adjusting your search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading && filteredUsers.map((user) => {
                const role = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
                const isCurrentUser = currentUser?.id === user.id
                const isSaving = savingUserId === user.id

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-sm border border-slate-200">
                          <UserCog className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name || 'Unnamed User'}</p>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">ID: {user.id?.substring(0, 8) || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={role === 'ADMIN' ? 'info' : role === 'TECHNICIAN' ? 'pending' : role === 'MANAGER' ? 'error' : 'success'}>
                        {role}
                      </StatusBadge>
                      {role === 'TECHNICIAN' && user.technicianType ? (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {user.technicianType}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {isCurrentUser ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/50">
                            <Check className="h-3.5 w-3.5" /> Active Session
                          </div>
                        ) : (
                          <>
                            <div className="relative inline-block w-32 text-left">
                              <select
                                value={role}
                                disabled={isSaving}
                                onChange={(event) => updateRole(user.id, event.target.value)}
                                className="block w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                              >
                                {roleOptions.map((option) => (
                                  <option key={option} value={option}>
                                    Make {option}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                {isSaving ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                            <button
                              className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this user?')) {
                                  // Implement delete logic here
                                  toast('Delete user feature not implemented')
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50/50 p-4 text-center text-xs font-medium text-slate-500">
          Showing {filteredUsers.length} users
        </div>
      </div>

      {technicianModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Technician Details</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-slate-900">Set technician type</h3>
              <p className="mt-1 text-sm text-slate-600">Type a category (e.g. Electrical, Plumbing, IT Support). Previous entries will appear as suggestions.</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Technician type</span>
                <input
                  value={technicianModal.value}
                  onChange={(event) => setTechnicianModal((current) => ({ ...current, value: event.target.value }))}
                  list="technician-type-suggestions"
                  placeholder="e.g. Network, CCTV, Electrical..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <datalist id="technician-type-suggestions">
                  {technicianTypes.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTechnicianModal({ open: false, userId: '', role: 'TECHNICIAN', value: '' })}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmTechnicianType}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Save & Assign Technician Role
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
