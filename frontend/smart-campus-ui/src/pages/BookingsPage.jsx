// Booking request UI component.
import { useEffect, useMemo, useState, useCallback } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Search, XCircle } from 'lucide-react'
import { bookingService } from '../services/bookingService'
import { resourceService } from '../services/resourceService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'

function toLocalDateTimeValue(date = new Date()) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return copy.toISOString().slice(0, 16)
}

// Custom debounce hook to optimize search performance
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function statusTone(status) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  return 'pending'
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export default function BookingsPage() {
  const { roles } = useAuth()
  const isAdmin = useMemo(() => roles.includes('ADMIN'), [roles])

  const defaultFilters = useMemo(() => ({
    query: '',
    resourceId: '',
    status: '',
  }), [])

  const [resources, setResources] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const debouncedQuery = useDebounce(filters.query, 300)

  const [form, setForm] = useState({
    resourceId: '',
    startTime: toLocalDateTimeValue(),
    endTime: toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)),
    purpose: '',
  })

  const activeResources = useMemo(
    () => resources.filter((resource) => resource.status === 'ACTIVE'),
    [resources],
  )

  // Enhanced booking filter with debounced search and multi-field matching
  const filteredBookings = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()

    return bookings.filter((booking) => {
      // Filter by resource
      if (appliedFilters.resourceId && booking.resourceId !== appliedFilters.resourceId) {
        return false
      }

      // Filter by status
      if (appliedFilters.status && booking.status !== appliedFilters.status) {
        return false
      }

      // Search query filter
      if (!query) {
        return true
      }

      // Enhanced search across multiple fields
      const searchableFields = [
        booking.resourceName || '',
        booking.userName || '',
        booking.userEmail || '',
        booking.purpose || '',
        booking.status || '',
      ]

      return searchableFields.some((field) => 
        field.toLowerCase().includes(query)
      )
    })
  }, [bookings, appliedFilters, debouncedQuery])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [resourceData, bookingData] = await Promise.all([
        resourceService.getAll(),
        bookingService.getBookings(),
      ])
      setResources(Array.isArray(resourceData) ? resourceData : [])
      setBookings(Array.isArray(bookingData) ? bookingData : [])
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || 'Failed to load booking data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

// Apply debounced search filters
useEffect(() => {
  setAppliedFilters(current => ({ ...current, query: debouncedQuery }))
}, [debouncedQuery])

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    
    // Apply filters immediately for non-search fields
    if (field !== 'query') {
      setAppliedFilters(newFilters)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  const handleCreateBooking = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await bookingService.createBooking({
        resourceId: form.resourceId,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim() || null,
      })
      setSuccess('Booking request submitted successfully.')
      setForm((current) => ({
        ...current,
        purpose: '',
      }))
      await loadData()
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || requestError?.response?.data?.details?.join(', ')
        || 'Failed to create booking.',
      )
    } finally {
      setSaving(false)
    }
  }

  const reviewBooking = async (bookingId, action) => {
    setError('')
    setSuccess('')

    try {
      if (action === 'approve') {
        await bookingService.approveBooking(bookingId)
        setSuccess('Booking approved.')
      } else {
        await bookingService.rejectBooking(bookingId)
        setSuccess('Booking rejected.')
      }
      await loadData()
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || 'Failed to update booking status.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {isAdmin ? 'Booking Requests Management' : 'Resource Bookings'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isAdmin 
                ? 'Review and approve or reject pending booking requests from users.'
                : 'Request bookings for active resources and track their status.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Only show create booking form for users, not admins */}
      {!isAdmin && (
        <section className="glass-panel p-6">
          <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Create Booking</h3>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateBooking}>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</span>
            <select
              value={form.resourceId}
              onChange={(event) => setForm((current) => ({ ...current, resourceId: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select a resource</option>
              {activeResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} | {resource.type} | {resource.location}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Start Time</span>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">End Time</span>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Purpose (optional)</span>
            <textarea
              rows={3}
              value={form.purpose}
              onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Describe the reason for this booking"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
            >
              <CalendarDays className="h-4 w-4" />
              {saving ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
        </section>
      )}

      <section className="glass-panel p-6">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Filter Bookings</h3>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSearch}>
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(event) => handleFilterChange('query', event.target.value)}
                placeholder="Search by resource, status, purpose or user"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</span>
            <select
              value={filters.resourceId}
              onChange={(event) => handleFilterChange('resourceId', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All resources</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>

          <div className="xl:col-span-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Search className="h-4 w-4" /> Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      {loading ? (
        <div className="glass-panel flex min-h-[220px] items-center justify-center p-6">
          <LoadingSpinner label="Loading bookings..." />
        </div>
      ) : null}

      {!loading && filteredBookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Create a booking request to get started."
        />
      ) : null}

      {!loading && filteredBookings.length > 0 ? (
        <section className="space-y-4">
          {filteredBookings.map((booking) => (
            <article key={booking.id} className="glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-lg font-bold text-slate-900">{booking.resourceName}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Booked by: {booking.userName || booking.userEmail}</p>
                  {booking.purpose ? <p className="mt-2 text-sm text-slate-700">Purpose: {booking.purpose}</p> : null}
                  {booking.reviewedBy ? (
                    <p className="mt-1 text-xs text-slate-500">Reviewed by {booking.reviewedBy} on {formatDateTime(booking.reviewedAt)}</p>
                  ) : null}
                </div>
                <StatusBadge tone={statusTone(booking.status)}>{booking.status}</StatusBadge>
              </div>

              {isAdmin && booking.status === 'PENDING' ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => reviewBooking(booking.id, 'approve')}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewBooking(booking.id, 'reject')}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {/* Only show available resources to users, not admins */}
      {!isAdmin && (
        <section className="glass-panel p-6">
          <h3 className="mb-3 font-display text-lg font-bold text-slate-900">Available Resources</h3>
          {activeResources.length === 0 ? (
            <p className="text-sm text-slate-600">No active resources available right now.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {activeResources.map((resource) => (
                <div key={resource.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{resource.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{resource.type} | Capacity {resource.capacity}</p>
                  <p className="mt-1 text-sm text-slate-600">{resource.location}</p>
                  <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {resource.availableFrom} - {resource.availableTo}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
