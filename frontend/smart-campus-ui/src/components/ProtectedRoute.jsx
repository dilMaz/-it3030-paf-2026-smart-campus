import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'

export default function ProtectedRoute({ allowedRoles }) {
  const [checking, setChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    const savedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('smartCampusUser') || 'null')
      } catch {
        return null
      }
    })()

    if (savedUser) {
      if (isMounted) {
        setCurrentUser(savedUser)
        setChecking(false)
      }
      return () => {
        isMounted = false
      }
    }

    axios.get('http://localhost:8080/api/auth/me', { withCredentials: true })
      .then((response) => {
        if (!isMounted) {
          return
        }
        setCurrentUser(response.data)
        localStorage.setItem('smartCampusUser', JSON.stringify(response.data))
      })
      .catch(() => {
        if (!isMounted) {
          return
        }
        setCurrentUser(null)
      })
      .finally(() => {
        if (isMounted) {
          setChecking(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (checking) {
    return null
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roles = Array.isArray(currentUser.roles) ? currentUser.roles : []
    const hasAllowedRole = roles.some((role) => allowedRoles.includes(role))
    if (!hasAllowedRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
