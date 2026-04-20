const colorMap = {
  success: { bg: 'bg-emerald-50 border-emerald-200/60 text-emerald-700', dot: 'bg-emerald-500' },
  error: { bg: 'bg-rose-50 border-rose-200/60 text-rose-700', dot: 'bg-rose-500' },
  pending: { bg: 'bg-amber-50 border-amber-200/60 text-amber-700', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50 border-blue-200/60 text-blue-700', dot: 'bg-blue-500' },
}

export default function StatusBadge({ tone = 'info', children }) {
  const styles = colorMap[tone] || colorMap.info

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm ${styles.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot} animate-pulse`} />
      {children}
    </span>
  )
}
