import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const roleOptions = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER']

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    axios.get('http://localhost:8080/api/auth/users', { withCredentials: true })
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
    fetchUsers()
  }, [])

  const updateRole = (userId, newRole) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const currentRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
    if (currentRole === newRole) return

    setSavingUserId(userId)
    setError('')
    setSuccess('')

    axios.patch(
      `http://localhost:8080/api/auth/users/${userId}/role`,
      { role: newRole },
      { withCredentials: true }
    )
      .then((response) => {
        setUsers((current) => current.map((u) => (
          u.id === userId ? response.data : u
        )))
        setSuccess(`✓ Role updated to ${newRole} successfully`)
        setTimeout(() => setSuccess(''), 3500)
      })
      .catch((requestError) => {
        const errorMsg = requestError?.response?.data?.error || 'Unable to update user role.'
        setError(`✗ ${errorMsg}`)
        setTimeout(() => setError(''), 5000)
      })
      .finally(() => {
        setSavingUserId('')
      })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '28px', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{
        background: 'white',
        borderRadius: '14px',
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>🛡️ Admin Role Management</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>Manage user roles and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => fetchUsers()}
            disabled={loading}
            style={{
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            ⟳ Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              border: 'none',
              background: '#111827',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {success && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '12px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 2fr', background: '#111827', color: 'white', fontWeight: '600', fontSize: '14px' }}>
          <div style={{ padding: '14px' }}>Name</div>
          <div style={{ padding: '14px' }}>Email</div>
          <div style={{ padding: '14px' }}>Current Role</div>
          <div style={{ padding: '14px' }}>Change Role</div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 14px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>⏳ Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px 14px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No users found.</div>
        ) : (
          users.map((user) => {
            const role = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'USER'
            const isCurrentUser = currentUser?.id === user.id
            const isSaving = savingUserId === user.id

            return (
              <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 2fr 2fr', borderTop: '1px solid #f3f4f6', alignItems: 'center', transition: 'background 0.2s' }}>
                <div style={{ padding: '14px', color: '#1f2937', fontWeight: '500', fontSize: '14px' }}>
                  {user.name || '-'}
                </div>
                <div style={{ padding: '14px', color: '#6b7280', fontSize: '14px' }}>{user.email || '-'}</div>
                <div style={{ padding: '14px', fontWeight: '600', color: '#667eea', fontSize: '14px' }}>
                  [{role}]
                </div>
                <div style={{ padding: '14px' }}>
                  {isCurrentUser ? (
                    <div style={{
                      padding: '8px 10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '6px',
                      fontSize: '13px',
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      (Your Account)
                    </div>
                  ) : (
                    <select
                      value={role}
                      disabled={isSaving}
                      onChange={(event) => updateRole(user.id, event.target.value)}
                      style={{
                        width: '100%',
                        minWidth: '140px',
                        border: isSaving ? '2px solid #667eea' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        background: isSaving ? '#f0f2f5' : 'white',
                        color: '#111827',
                        WebkitTextFillColor: '#111827',
                        cursor: isSaving ? 'wait' : 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        fontWeight: '500',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option} style={{ color: '#111827', background: '#ffffff' }}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '16px 14px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '10px', fontSize: '13px', color: '#4c63b6', lineHeight: '1.5' }}>
        <strong>ℹ️ Role Descriptions:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
          <li><strong>USER:</strong> Basic access to bookings, notifications, tickets</li>
          <li><strong>ADMIN:</strong> Full system access, role management, all resources</li>
          <li><strong>TECHNICIAN:</strong> Can manage and resolve maintenance tickets</li>
          <li><strong>MANAGER:</strong> Can oversee bookings and generate reports</li>
        </ul>
      </div>
    </div>
  )
}
