const colorMap = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  error: 'bg-rose-50 text-rose-700 ring-rose-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
}

export default function StatusBadge({ tone = 'info', children }) {
  const classes = colorMap[tone] || colorMap.info

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}>
      {children}
    </span>
  )
}
