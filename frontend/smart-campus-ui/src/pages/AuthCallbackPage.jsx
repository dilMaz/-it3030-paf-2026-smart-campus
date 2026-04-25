import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { POST_LOGIN_STORAGE_KEY } from '../constants/authStorage'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    let active = true

    const finalizeLogin = async () => {
      try {
        const user = await refreshUser()
        if (!active) return

        if (user) {
          const targetPath = sessionStorage.getItem(POST_LOGIN_STORAGE_KEY) || '/dashboard'
          sessionStorage.removeItem(POST_LOGIN_STORAGE_KEY)
          navigate(targetPath, { replace: true })
          return
        }
      } catch {
        // Fallback below handles navigation errors.
      }

      if (active) {
        navigate('/login?error=oauth', { replace: true })
      }
    }

    finalizeLogin()

    return () => {
      active = false
    }
  }, [navigate, refreshUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoadingSpinner label="Finalizing sign in..." />
    </div>
  )
}
