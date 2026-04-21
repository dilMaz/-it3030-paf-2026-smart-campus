import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)
const STORAGE_KEY = 'smartCampusUser'
const TOKEN_STORAGE_KEY = 'smartCampusToken'
const SESSION_CHECK_TIMEOUT_MS = 10000

function normalizeRole(role) {
  if (typeof role !== 'string') return null
  const value = role.trim()
  if (!value) return null
  return value.replace(/^ROLE_/, '').toUpperCase()
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser)
  const [initializing, setInitializing] = useState(true)

  const saveUser = useCallback((nextUser) => {
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      saveUser(currentUser)
      return currentUser
    } catch {
      saveUser(null)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return null
    }
  }, [saveUser])

  useEffect(() => {
    let active = true
    let timeoutId

    // Always validate the backend session so a stale local cache cannot bypass auth.
    timeoutId = setTimeout(() => {
      if (active) {
        setInitializing(false)
      }
    }, SESSION_CHECK_TIMEOUT_MS)

    refreshUser().finally(() => {
      if (active) {
        clearTimeout(timeoutId)
        setInitializing(false)
      }
    })

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [refreshUser])

  const login = useCallback(async (credentialsOrEmail, password) => {
    const credentials = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password }
      : credentialsOrEmail

    const loginResponse = await authService.login(credentials)
    const loggedInUser = loginResponse?.user || loginResponse

    if (loginResponse?.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, loginResponse.token)
    }

    saveUser(loggedInUser)
    return loggedInUser
  }, [saveUser])

  const signup = useCallback(async (payload) => {
    return authService.signup(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore API logout failures and still clear local state.
    }
    saveUser(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [saveUser])

  const roles = useMemo(() => {
    if (!Array.isArray(user?.roles)) return []
    return user.roles.map(normalizeRole).filter(Boolean)
  }, [user])

  const value = useMemo(() => ({
    user,
    roles,
    initializing,
    isAuthenticated: !!user,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (allowedRoles = []) => allowedRoles.some((role) => roles.includes(role)),
    refreshUser,
    login,
    signup,
    logout,
  }), [initializing, login, logout, refreshUser, roles, signup, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
