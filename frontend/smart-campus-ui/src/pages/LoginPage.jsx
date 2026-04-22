import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, Zap, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'

const POST_LOGIN_STORAGE_KEY = 'smartCampusPostLoginPath'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleGoogleLogin = () => {
    localStorage.removeItem('smartCampusUser')
    localStorage.removeItem('smartCampusToken')
    sessionStorage.setItem(POST_LOGIN_STORAGE_KEY, from)
    window.location.href = authService.getGoogleLoginUrl()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) {
      return
    }

    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)

    try {
      await login({ email: trimmedEmail, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-body selection:bg-blue-500/30 selection:text-blue-900">
      {/* Left Pane - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-none lg:w-1/2 xl:w-5/12">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">Smart Campus</span>
            </Link>
            <h2 className="mt-8 font-display text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access your workspace.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between items-center">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-12 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-3 text-xs font-medium uppercase text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Image/Branding */}
      <div className="relative hidden w-full flex-1 lg:block">
        <div className="absolute inset-0 bg-slate-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative max-w-lg text-center">
            <h3 className="font-display text-4xl font-bold tracking-tight text-white mb-6">
              Operations management, simplified.
            </h3>
            <p className="text-lg text-slate-300 leading-relaxed mb-12">
              Join the unified platform that brings facilities management, booking workflows, and ticketing into a single, intuitive interface.
            </p>
            
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-2xl overflow-hidden">
               <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-purple-500/30 blur-[40px]" />
               <img src="/hero-campus.svg" alt="App preview" className="rounded-xl border border-white/10 w-full object-cover bg-slate-800" style={{ aspectRatio: '16/9' }}
                 onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full aspect-[16/9] flex items-center justify-center bg-slate-800 rounded-xl"><p class="text-slate-400 font-medium">Dashboard Interface</p></div>';
                }}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}