export default function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 text-slate-600 ${className}`} role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
