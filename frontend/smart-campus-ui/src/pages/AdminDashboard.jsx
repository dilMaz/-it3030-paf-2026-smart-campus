import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BookOpenCheck, Building2, Settings, Ticket } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { resourceService } from '../services/resourceService'

const TYPE_ORDER = ['EQUIPMENT', 'LAB', 'LECTURE_HALL', 'MEETING_ROOM']
const TYPE_COLORS = {
  EQUIPMENT: '#8b5cf6',
  LAB: '#16a34a',
  LECTURE_HALL: '#0284c7',
  MEETING_ROOM: '#f59e0b',
}

const QUICK_LINKS = [
  {
    title: 'Manage Resources',
    description: 'Add, update, and organize facilities and equipment.',
    to: '/facilities',
    icon: Building2,
  },
  {
    title: 'Bookings',
    description: 'View and control room and lab reservations.',
    to: '/bookings',
    icon: BookOpenCheck,
  },
  {
    title: 'IT Tickets',
    description: 'Track and resolve support requests faster.',
    to: '/tickets',
    icon: Ticket,
  },
  {
    title: 'Notifications',
    description: 'Send announcements and alerts across campus.',
    to: '/notifications',
    icon: Bell,
  },
  {
    title: 'System Settings',
    description: 'Manage user roles and platform access.',
    to: '/admin/users',
    icon: Settings,
  },
]

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (Math.PI / 180) * angleInDegrees
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, startAngle)
  const end = polarToCartesian(cx, cy, radius, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

function ResourceTypePie({ data }) {
  const cx = 168
  const cy = 156
  const radius = 108
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <svg width="380" height="320" viewBox="0 0 380 320" role="img" aria-label="No resource type data">
        <circle cx={cx} cy={cy} r={radius} fill="#e2e8f0" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="14" fontWeight="600">
          No Data
        </text>
      </svg>
    )
  }

  const slices = data.reduce(
    (accumulator, item) => {
      const startAngle = accumulator.currentAngle
      const sliceAngle = item.count > 0 ? (item.count / total) * 360 : 0
      const endAngle = startAngle + sliceAngle
      const labelAngle = item.count > 0
        ? startAngle + sliceAngle / 2
        : startAngle + 12 + accumulator.zeroLabelOffset * 14

      return {
        currentAngle: item.count > 0 ? endAngle : startAngle,
        zeroLabelOffset: item.count > 0 ? accumulator.zeroLabelOffset : accumulator.zeroLabelOffset + 1,
        values: [...accumulator.values, { ...item, startAngle, endAngle, sliceAngle, labelAngle }],
      }
    },
    { currentAngle: -90, zeroLabelOffset: 0, values: [] },
  ).values

  return (
    <svg width="380" height="320" viewBox="0 0 380 320" role="img" aria-label="Resource type distribution">
      {slices.map((item) => {
        const lineStart = polarToCartesian(cx, cy, radius, item.labelAngle)
        const lineEnd = polarToCartesian(cx, cy, radius + 22, item.labelAngle)

        return (
          <g key={item.type}>
            {item.count > 0 ? (
              <path d={describeSlice(cx, cy, radius, item.startAngle, item.endAngle)} fill={item.color} opacity="0.9" />
            ) : null}
            {item.count > 0 ? (
              <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} stroke={item.color} strokeWidth="1.5" />
            ) : null}
            <text
              x={lineEnd.x + (lineEnd.x >= cx ? 8 : -8)}
              y={lineEnd.y}
              textAnchor={lineEnd.x >= cx ? 'start' : 'end'}
              dominantBaseline="middle"
              fill={item.color}
              fontSize="12"
              fontWeight="700"
            >
              {item.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await resourceService.getAll()
        setResources(Array.isArray(data) ? data : [])
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load dashboard data.')
        setResources([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const summary = useMemo(() => {
    const totalResources = resources.length
    const active = resources.filter((resource) => resource.status === 'ACTIVE').length
    const outOfService = resources.filter((resource) => resource.status === 'OUT_OF_SERVICE').length
    const totalCapacity = resources.reduce((sum, resource) => sum + toNumber(resource.capacity), 0)
    const resourceTypes = TYPE_ORDER.map((type) => ({
      type,
      color: TYPE_COLORS[type],
      count: resources.filter((resource) => resource.type === type).length,
    }))

    return {
      totalResources,
      active,
      outOfService,
      totalCapacity,
      resourceTypes,
    }
  }, [resources])

  return (
    <section className="mx-auto w-full max-w-[1380px] space-y-7 pb-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 lg:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600 lg:text-base">Overview of campus resources, user management, and quick access to modules.</p>
      </header>

      {loading ? (
        <div className="rounded-[26px] border border-slate-200/90 bg-slate-50/90 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          <LoadingSpinner label="Loading admin dashboard..." />
        </div>
      ) : null}

      {!loading ? (
        <>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
              <p className="text-base font-semibold text-slate-500">Total Resources</p>
              <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.totalResources}</p>
            </article>
            <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
              <p className="text-base font-semibold text-slate-500">Active</p>
              <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.active}</p>
            </article>
            <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
              <p className="text-base font-semibold text-slate-500">Out Of Service</p>
              <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.outOfService}</p>
            </article>
            <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
              <p className="text-base font-semibold text-slate-500">Total Capacity</p>
              <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.totalCapacity}</p>
            </article>
          </div>

          <article className="rounded-[26px] border border-slate-200/90 bg-slate-50/95 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)] lg:p-7">
            <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">Resource Types</h2>
            <div className="mt-4 flex flex-col items-center justify-between gap-8 md:mt-6 md:flex-row md:items-center">
              <div className="flex w-full justify-center lg:w-auto lg:pl-2">
                <ResourceTypePie data={summary.resourceTypes} />
              </div>

              <div className="w-full max-w-sm space-y-3 md:pr-4 lg:pr-6">
                {summary.resourceTypes.map((item) => (
                  <p key={item.type} className="flex items-center gap-2.5 text-base font-semibold tracking-wide text-slate-900">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.type}</span>
                    <span className="ml-auto text-slate-500">{item.count}</span>
                  </p>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 p-5 shadow-[0_16px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {!loading && !error && summary.totalResources === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No resources found yet. Add resources to see full dashboard analytics.
        </div>
      ) : null}
    </section>
  )
}
