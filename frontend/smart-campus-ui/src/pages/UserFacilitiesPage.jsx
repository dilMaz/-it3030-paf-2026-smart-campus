import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Layers3,
  MapPin,
  Search,
  Sparkles,
  SquareCheckBig,
  Building2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatusBadge from '../components/ui/StatusBadge'
import { facilityService } from '../services/facilityService'
import { resourceService } from '../services/resourceService'

const RESOURCE_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Halls' },
  { value: 'LAB', label: 'Laboratory Rooms' },
  { value: 'MEETING_ROOM', label: 'Meeting Spaces' },
  { value: 'EQUIPMENT', label: 'Equipment' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'ANY', label: 'Anytime' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
]

const INITIAL_FILTERS = {
  search: '',
  selectedTypes: [],
  minCapacity: 0,
  location: '',
  status: 'ALL',
  availability: 'ANY',
}

const TYPE_THEME = {
  LECTURE_HALL: {
    accent: 'from-blue-500 via-indigo-500 to-slate-900',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    seat: '#2563eb',
  },
  LAB: {
    accent: 'from-emerald-500 via-teal-500 to-slate-900',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    seat: '#0f766e',
  },
  MEETING_ROOM: {
    accent: 'from-amber-500 via-orange-500 to-slate-900',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    seat: '#d97706',
  },
  EQUIPMENT: {
    accent: 'from-violet-500 via-fuchsia-500 to-slate-900',
    badge: 'bg-violet-50 text-violet-700 border-violet-100',
    seat: '#7c3aed',
  },
}

const DEFAULT_THEME = {
  accent: 'from-slate-500 via-slate-700 to-slate-900',
  badge: 'bg-slate-50 text-slate-700 border-slate-100',
  seat: '#475569',
}

function toSentenceCase(value) {
  if (!value) return '-'
  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusTone(status) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'OUT_OF_SERVICE') return 'error'
  return 'info'
}

function getTheme(type) {
  return TYPE_THEME[type] || DEFAULT_THEME
}

function getResourceCode(resource, index) {
  const prefix = {
    LECTURE_HALL: 'LE',
    LAB: 'LB',
    MEETING_ROOM: 'MR',
    EQUIPMENT: 'EQ',
  }[resource.type] || 'RS'

  return `${prefix}-${String(index + 1).padStart(3, '0')}`
}

function matchesAvailability(resource, availability) {
  if (availability === 'ANY') return true
  if (availability === 'TODAY') return resource.status === 'ACTIVE'
  return resource.status === 'ACTIVE'
}

function buildCoverArt(resource, index) {
  const theme = getTheme(resource.type)
  const accentStripe = index % 3 === 0 ? '#ffffff' : index % 3 === 1 ? '#e2e8f0' : '#cbd5e1'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${resource.name}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.seat}" stop-opacity="0.15" />
          <stop offset="45%" stop-color="${theme.seat}" stop-opacity="0.4" />
          <stop offset="100%" stop-color="${theme.seat}" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill="url(#bg)" />
      <circle cx="520" cy="68" r="116" fill="#ffffff" opacity="0.12" />
      <circle cx="112" cy="74" r="66" fill="#ffffff" opacity="0.10" />
      <rect x="34" y="34" width="572" height="292" rx="24" fill="url(#glass)" opacity="0.6" />
      <rect x="76" y="124" width="488" height="120" rx="18" fill="#ffffff" opacity="0.15" />
      <rect x="94" y="142" width="78" height="68" rx="12" fill="#ffffff" opacity="0.22" />
      <rect x="188" y="142" width="78" height="68" rx="12" fill="#ffffff" opacity="0.22" />
      <rect x="282" y="142" width="78" height="68" rx="12" fill="#ffffff" opacity="0.22" />
      <rect x="376" y="142" width="78" height="68" rx="12" fill="#ffffff" opacity="0.22" />
      <rect x="470" y="142" width="70" height="68" rx="12" fill="#ffffff" opacity="0.22" />
      <path d="M82 248h476c18 0 28 10 28 28v4H54v-4c0-18 10-28 28-28Z" fill="#0f172a" opacity="0.42" />
      <rect x="76" y="258" width="488" height="24" rx="12" fill="#ffffff" opacity="0.18" />
      <g fill="${theme.seat}">
        <rect x="108" y="170" width="20" height="18" rx="5" />
        <rect x="136" y="170" width="20" height="18" rx="5" />
        <rect x="164" y="170" width="20" height="18" rx="5" />
        <rect x="208" y="170" width="20" height="18" rx="5" />
        <rect x="236" y="170" width="20" height="18" rx="5" />
        <rect x="264" y="170" width="20" height="18" rx="5" />
        <rect x="308" y="170" width="20" height="18" rx="5" />
        <rect x="336" y="170" width="20" height="18" rx="5" />
        <rect x="364" y="170" width="20" height="18" rx="5" />
        <rect x="408" y="170" width="20" height="18" rx="5" />
        <rect x="436" y="170" width="20" height="18" rx="5" />
        <rect x="464" y="170" width="20" height="18" rx="5" />
      </g>
      <rect x="46" y="46" width="162" height="34" rx="17" fill="#ffffff" opacity="0.16" />
      <text x="66" y="68" fill="#ffffff" font-family="Manrope, Arial, sans-serif" font-size="14" font-weight="700">Campus catalogue</text>
      <rect x="474" y="46" width="102" height="34" rx="17" fill="${accentStripe}" opacity="0.18" />
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function normalizeSearch(resource) {
  return [resource.name, resource.type, resource.location, resource.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function normalizeLocation(resource) {
  return String(resource.location || '').toLowerCase()
}

function isSelected(values, value) {
  return values.includes(value)
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export default function UserFacilitiesPage() {
  const [resources, setResources] = useState([])
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadResources = async () => {
      setLoading(true)
      setError('')

      try {
        const [facilityData, resourceData] = await Promise.all([
          facilityService.getFacilities(),
          resourceService.getAll(),
        ])
        if (active) {
          const normalizedFacilities = Array.isArray(facilityData)
            ? facilityData.map((item) => ({ ...item, sourceType: 'Facility', uniqueId: `facility-${item.id}` }))
            : []
          const normalizedResources = Array.isArray(resourceData)
            ? resourceData.map((item) => ({ ...item, sourceType: 'Resource', uniqueId: `resource-${item.id}` }))
            : []

          setResources([...normalizedFacilities, ...normalizedResources])
        }
      } catch (requestError) {
        if (active) {
          setError(requestError?.response?.data?.message || 'Failed to load facilities.')
          setResources([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadResources()

    return () => {
      active = false
    }
  }, [])

  const filteredResources = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase()
    const locationTerm = filters.location.trim().toLowerCase()

    return resources.filter((resource) => {
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(resource.type)) {
        return false
      }

      if (filters.status !== 'ALL' && resource.status !== filters.status) {
        return false
      }

      if (Number(resource.capacity || 0) < Number(filters.minCapacity || 0)) {
        return false
      }

      if (locationTerm && !normalizeLocation(resource).includes(locationTerm)) {
        return false
      }

      if (!matchesAvailability(resource, filters.availability)) {
        return false
      }

      if (!searchTerm) {
        return true
      }

      return normalizeSearch(resource).includes(searchTerm)
    })
  }, [filters, resources])

  const activeCount = useMemo(
    () => filteredResources.filter((resource) => resource.status === 'ACTIVE').length,
    [filteredResources],
  )

  const totalCapacity = useMemo(
    () => filteredResources.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0),
    [filteredResources],
  )

  const typeCounts = useMemo(
    () => RESOURCE_TYPES.map((type) => ({
      ...type,
      count: filteredResources.filter((resource) => resource.type === type.value).length,
    })),
    [filteredResources],
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200/70 bg-white/65 p-5 xl:border-b-0 xl:border-r">
            <div className="mb-6">
              <p className="font-display text-2xl font-black text-slate-900">Resource Filters</p>
              <p className="mt-1 text-sm text-slate-500">Refine the catalogue using availability, type, and capacity.</p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Filter className="h-4 w-4 text-slate-400" />
                  Resource Type
                </div>
                <div className="space-y-2">
                  {RESOURCE_TYPES.map((type) => {
                    const checked = isSelected(filters.selectedTypes, type.value)

                    return (
                      <label key={type.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setFilters((current) => ({ ...current, selectedTypes: toggleValue(current.selectedTypes, type.value) }))}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{type.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Sparkles className="h-4 w-4 text-slate-400" />
                  Minimum Capacity
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.minCapacity}
                  onChange={(event) => setFilters((current) => ({ ...current, minCapacity: Number(event.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>0</span>
                  <span>{filters.minCapacity}</span>
                  <span>500+</span>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Location
                </div>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                  placeholder="e.g. Main Building"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Layers3 className="h-4 w-4 text-slate-400" />
                  Status
                </div>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Resources</option>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  Availability
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((option) => {
                    const active = filters.availability === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilters((current) => ({ ...current, availability: option.value }))}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current }))}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>

          <div className="p-5 lg:p-6">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h1 className="font-display text-4xl font-black tracking-tight text-blue-700">Campus Catalogue</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Showing {filteredResources.length} resources matching your criteria.
                  </p>
                </div>

                <div className="relative w-full xl:max-w-[380px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder="Search facilities, equipment, or assets..."
                    className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <LoadingSpinner label="Loading facilities..." />
              </div>
            ) : null}

            {!loading && filteredResources.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  icon={Building2}
                  title="No resources found"
                  description="Try adjusting the filters or clearing the search to browse the full catalogue."
                />
              </div>
            ) : null}

            {!loading && filteredResources.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredResources.map((resource, index) => {
                  const theme = getTheme(resource.type)
                  const coverArt = buildCoverArt(resource, index)

                  return (
                    <motion.article
                      key={resource.uniqueId || resource.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(15,23,42,0.12)]"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img src={coverArt} alt="" className="h-full w-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${theme.accent} opacity-35`} />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-3 text-white">
                          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/65 backdrop-blur-sm">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/65 backdrop-blur-sm">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-display text-xl font-bold text-slate-900">{resource.name}</h2>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${theme.badge}`}>
                                {getResourceCode(resource, index)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {toSentenceCase(resource.type)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {resource.sourceType || 'Resource'}
                              </span>
                            </div>
                          </div>
                          <StatusBadge tone={statusTone(resource.status)}>{toSentenceCase(resource.status)}</StatusBadge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">Capacity: {resource.capacity ?? 0}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{toSentenceCase(resource.type)}</span>
                        </div>

                        <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{resource.location || 'Campus location not specified'}</span>
                        </div>

                        <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{resource.status === 'ACTIVE' ? 'Available now' : 'Unavailable'}</span>
                        </div>

                        {resource.description ? (
                          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            {resource.description}
                          </p>
                        ) : null}

                        <Link
                          to="/bookings"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          View Schedule
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Total resources</p>
          <p className="mt-4 font-display text-3xl font-black text-slate-900">{filteredResources.length}</p>
        </article>
        <article className="glass-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Active now</p>
          <p className="mt-4 font-display text-3xl font-black text-slate-900">{activeCount}</p>
        </article>
        <article className="glass-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Total capacity</p>
          <p className="mt-4 font-display text-3xl font-black text-slate-900">{totalCapacity}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {typeCounts.map((item) => (
          <article key={item.value} className="glass-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-3 font-display text-3xl font-black text-slate-900">{item.count}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{ width: `${filteredResources.length === 0 ? 0 : Math.max(8, (item.count / filteredResources.length) * 100)}%` }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
