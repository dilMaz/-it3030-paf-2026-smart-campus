import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'

export default function LoginPage() {
  const { isAuthenticated, login, initializing } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password])

  const handleGoogleLogin = () => {
    localStorage.removeItem('smartCampusUser')
    window.location.href = authService.getGoogleLoginUrl()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (loginError) {
      setError(loginError?.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  if (!initializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.3),_transparent_40%),#f3f6ff] px-4 py-8 font-body">
      <div className="absolute -left-16 top-10 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-24 right-8 h-60 w-60 rounded-full bg-fuchsia-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto flex min-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-soft backdrop-blur"
      >
        <section className="hidden w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-10 text-white lg:block">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Secure Access
          </p>
          <h1 className="mt-6 font-display text-4xl font-black leading-tight">Smart Campus Operations Hub</h1>
          <p className="mt-4 text-sm text-blue-100">
            Coordinate facilities, bookings, maintenance tickets, and notifications from one role-based workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-blue-100">
            <li>Role-based dashboards for admins, technicians, and users</li>
            <li>Real-time notification center with actionable alerts</li>
            <li>Operational visibility designed for fast decisions</li>
          </ul>
        </section>

        <section className="w-full p-7 sm:p-10 lg:w-1/2">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Welcome Back</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Sign in to continue</h2>
            <p className="mt-2 text-sm text-slate-500">Use your email and password or continue with Google.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
              <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  required
                />
              </span>
            </label>

            {error ? (
              <p className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" />
              Continue with Google
            </button>

            <p className="pt-1 text-center text-sm text-slate-500">
              New here?{' '}
              <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </motion.div>
    </div>
  )
}