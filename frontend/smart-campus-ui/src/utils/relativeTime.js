export function toRelativeTime(dateValue) {
  if (!dateValue) return 'Just now'

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const value = Math.floor(seconds / interval.seconds)
    if (value >= 1) {
      return `${value} ${interval.label}${value > 1 ? 's' : ''} ago`
    }
  }

  return 'Just now'
}
