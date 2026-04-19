import { Sparkles } from 'lucide-react'

export default function EmptyState({
  title = 'Nothing to show yet',
  description = 'Try again later or refresh the page.',
  action,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-soft backdrop-blur">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
