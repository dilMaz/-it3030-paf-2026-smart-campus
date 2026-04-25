import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Clock, Hammer, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { ticketService } from '../services/ticketService'
import { useAuth } from '../hooks/useAuth'

function prettyLabel(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusTone(status) {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'IN_PROGRESS') return 'info'
  return 'pending'
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function TechnicianDashboard() {
  const { user } = useAuth()
  const technicianId = user?.id

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ticketService.getTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || 'Failed to load assigned tickets.',
      )
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const assignedTickets = useMemo(() => (
    tickets.filter((ticket) => technicianId && ticket.assignedTechnicianId === technicianId)
  ), [technicianId, tickets])

  const summary = useMemo(() => {
    const base = { total: assignedTickets.length, open: 0, inProgress: 0, resolved: 0 }
    return assignedTickets.reduce((acc, ticket) => {
      if (ticket.status === 'OPEN') acc.open += 1
      if (ticket.status === 'IN_PROGRESS') acc.inProgress += 1
      if (ticket.status === 'RESOLVED') acc.resolved += 1
      return acc
    }, base)
  }, [assignedTickets])

  return (
    <section className="mx-auto w-full max-w-[1380px] space-y-7 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 lg:text-4xl">Technician Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 lg:text-base">Tickets assigned to you by admins and ticket status updates.</p>
        </div>
        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
          <p className="text-base font-semibold text-slate-500">Assigned</p>
          <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.total}</p>
        </article>
        <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
          <p className="text-base font-semibold text-slate-500">Open</p>
          <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.open}</p>
        </article>
        <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
          <p className="text-base font-semibold text-slate-500">In Progress</p>
          <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.inProgress}</p>
        </article>
        <article className="rounded-[22px] border border-slate-200/90 bg-slate-50/95 px-6 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)]">
          <p className="text-base font-semibold text-slate-500">Resolved</p>
          <p className="mt-8 text-4xl font-black leading-none text-slate-900">{summary.resolved}</p>
        </article>
      </div>

      {loading ? (
        <div className="rounded-[26px] border border-slate-200/90 bg-slate-50/90 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          <LoadingSpinner label="Loading assigned tickets..." />
        </div>
      ) : null}

      {!loading && assignedTickets.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No assigned tickets yet"
          description="When an admin assigns a ticket to you, it will show up here."
        />
      ) : null}

      {!loading && assignedTickets.length > 0 ? (
        <div className="space-y-3">
          {assignedTickets.map((ticket) => (
            <article key={ticket.id} className="glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-lg font-bold text-slate-900">{prettyLabel(ticket.category)} Incident</h4>
                  <p className="mt-1 text-sm text-slate-600">{ticket.resourceOrLocation}</p>
                  <p className="mt-1 text-xs text-slate-500">Updated: {formatDateTime(ticket.updatedAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-700">{ticket.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/tickets"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ClipboardList className="h-4 w-4" />
                  Open Tickets
                </Link>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Clock className="h-4 w-4" />
                  Created {formatDateTime(ticket.createdAt)}
                </span>
                {ticket.resolvedAt ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                    <Clock className="h-4 w-4" />
                    Resolved {formatDateTime(ticket.resolvedAt)}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

