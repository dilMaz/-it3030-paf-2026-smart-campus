import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './ui/LoadingSpinner'

export default function ProtectedRoute({ allowedRoles }) {
  const { initializing, isAuthenticated, hasAnyRole } = useAuth()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verifying session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = hasAnyRole(allowedRoles)
    if (!hasAllowedRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
