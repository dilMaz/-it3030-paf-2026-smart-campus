import { Sparkles } from 'lucide-react'

export default function EmptyState({
  // eslint-disable-next-line no-unused-vars
  icon: Icon = Sparkles,
  title = 'Nothing to show yet',
  description = 'Try again later or refresh the page.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center transition-all hover:bg-slate-50">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
        <Icon className="relative h-8 w-8 text-blue-500" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}
