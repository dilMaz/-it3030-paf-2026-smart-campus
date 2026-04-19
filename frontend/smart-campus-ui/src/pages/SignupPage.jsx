import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'

const strengthRules = [
  { test: (value) => value.length >= 8, label: 'At least 8 characters' },
  { test: (value) => /[A-Z]/.test(value), label: 'At least one uppercase letter' },
  { test: (value) => /\d/.test(value), label: 'At least one number' },
]

export default function SignupPage() {
  const { isAuthenticated, initializing, signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passingRules = useMemo(() => strengthRules.filter((rule) => rule.test(password)), [password])
  const strength = passingRules.length
  const isStrong = strength === strengthRules.length

  const handleGoogleLogin = () => {
    localStorage.removeItem('smartCampusUser')
    window.location.href = authService.getGoogleLoginUrl()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isStrong) {
      setError('Please choose a stronger password.')
      return
    }

    setLoading(true)

    try {
      await signup({
        name,
        email,
        password,
        confirmPassword,
      })

      localStorage.removeItem('smartCampusUser')
      toast.success('Account created successfully. Please log in.')
      navigate('/login')
    } catch (registerError) {
      setError(registerError?.response?.data?.error || 'Account creation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!initializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.3),_transparent_40%),#f3f6ff] px-4 py-8 font-body">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto w-full max-w-xl rounded-3xl border border-white/80 bg-white/80 p-7 shadow-soft backdrop-blur sm:p-10"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Create your account</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Join Smart Campus Hub</h1>
          <p className="mt-2 text-sm text-slate-500">Set up your account to start managing operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</span>
            <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <UserRound className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
                required
              />
            </span>
          </label>

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

          <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Password Strength</p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(strength / strengthRules.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-1">
              {strengthRules.map((rule) => {
                const passed = rule.test(password)
                return (
                  <li key={rule.label} className={`text-xs ${passed ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {passed ? '✓' : '•'} {rule.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</span>
            <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
                required
              />
            </span>
          </label>

          {confirmPassword && password === confirmPassword ? (
            <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Passwords match
            </p>
          ) : null}

          {error ? (
            <p className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Create account'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" />
            Continue with Google
          </button>

          <p className="pt-1 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}