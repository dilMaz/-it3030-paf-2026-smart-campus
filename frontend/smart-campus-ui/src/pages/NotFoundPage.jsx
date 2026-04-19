import { Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_30%),#f8fafc] px-4">
      <div className="glass-panel w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-black text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you requested does not exist or was moved.
        </p>

        <div className="mt-6">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            Go to {isAuthenticated ? 'Dashboard' : 'Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}
