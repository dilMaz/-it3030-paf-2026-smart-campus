import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import api from '../services/api'

const roleOptions = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER']

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('smartCampusUser') || 'null')
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

  const updateRole = (userId, newRole) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const currentRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
    if (currentRole === newRole) return

    setSavingUserId(userId)
    setError('')

    api.patch(
      `/api/auth/users/${userId}/role`,
      { role: newRole },
    )
      .then((response) => {
        setUsers((current) => current.map((u) => (
          u.id === userId ? response.data : u
        )))
        toast.success(`Role updated to ${newRole}`)
      })
      .catch((requestError) => {
        const errorMsg = requestError?.response?.data?.error || 'Unable to update user role.'
        setError(errorMsg)
        toast.error(errorMsg)
      })
      .finally(() => {
        setSavingUserId('')
      })
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Admin Control
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">User Role Management</h2>
          <p className="mt-1 text-sm text-slate-600">Assign permissions with clear and auditable role changes.</p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => fetchUsers()}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="glass-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-100">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Current Role</th>
                <th className="px-4 py-3">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <LoadingSpinner label="Loading users..." />
                  </td>
                </tr>
              ) : null}

              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : null}

              {!loading && users.map((user) => {
                const role = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
                const isCurrentUser = currentUser?.id === user.id
                const isSaving = savingUserId === user.id

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <UserCog className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-900">{user.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={role === 'ADMIN' ? 'info' : role === 'TECHNICIAN' ? 'pending' : 'success'}>
                        {role}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {isCurrentUser ? (
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                          Your account
                        </span>
                      ) : (
                        <select
                          value={role}
                          disabled={isSaving}
                          onChange={(event) => updateRole(user.id, event.target.value)}
                          className="w-full min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800">
        <p className="font-semibold">Role descriptions</p>
        <ul className="mt-2 space-y-1 text-blue-700">
          <li><strong>USER:</strong> Basic access to bookings, notifications, and profile</li>
          <li><strong>ADMIN:</strong> Full access to all modules, including role management</li>
          <li><strong>TECHNICIAN:</strong> Ticket-focused workspace with notifications</li>
          <li><strong>MANAGER:</strong> Reserved role for reporting and operational oversight</li>
        </ul>
      </div>
    </div>
  )
}
