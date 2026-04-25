import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Search, Upload, Wrench } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { ticketService } from '../services/ticketService'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']

function prettyLabel(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

function statusTone(status) {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'IN_PROGRESS') return 'info'
  return 'pending'
}

function priorityButtonClass(active) {
  if (active) {
    return 'border-blue-400 bg-blue-100 text-blue-800'
  }
  return 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
}

function priorityTagClass(priority) {
  if (priority === 'CRITICAL') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (priority === 'HIGH') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (priority === 'MEDIUM') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getStatusActions(status) {
  if (status === 'OPEN') return ['IN_PROGRESS', 'RESOLVED', 'REJECTED']
  if (status === 'IN_PROGRESS') return ['RESOLVED', 'REJECTED']
  if (status === 'RESOLVED') return ['CLOSED']
  return []
}

export default function TicketsPage() {
  const { roles } = useAuth()
  const isAdmin = roles.includes('ADMIN')
  const isTechnician = roles.includes('TECHNICIAN')
  const isManager = roles.includes('MANAGER')
  const canManage = isAdmin || isTechnician || isManager
  const canCreate = roles.includes('USER')

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingTicketId, setUpdatingTicketId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({
    query: '',
    status: '',
    priority: '',
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [form, setForm] = useState({
    resourceOrLocation: '',
    category: '',
    contactInformation: '',
    description: '',
    priority: 'MEDIUM',
  })

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
        || 'Failed to load tickets.',
      )
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const filteredTickets = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return tickets.filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) {
        return false
      }

      if (filters.priority && ticket.priority !== filters.priority) {
        return false
      }

      if (!query) {
        return true
      }

      const searchableFields = [
        ticket.category,
        ticket.description,
        ticket.resourceOrLocation,
        ticket.contactInformation,
        ticket.reporterName,
        ticket.reporterEmail,
        ticket.status,
        ticket.priority,
      ]

      return searchableFields.some((field) => String(field || '').toLowerCase().includes(query))
    })
  }, [filters.priority, filters.query, filters.status, tickets])

  const handleCreateTicket = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.resourceOrLocation.trim() || !form.category.trim() || !form.contactInformation.trim() || !form.description.trim()) {
      setError('Please fill all required fields.')
      return
    }

    if (selectedFiles.length > 3) {
      setError('Only up to 3 attachments are allowed.')
      return
    }

    setSubmitting(true)
    try {
      await ticketService.createTicket({
        resourceOrLocation: form.resourceOrLocation.trim(),
        category: form.category.trim(),
        contactInformation: form.contactInformation.trim(),
        description: form.description.trim(),
        priority: form.priority,
        attachmentUrls: selectedFiles.map((file) => file.name),
      })

      setForm({
        resourceOrLocation: '',
        category: '',
        contactInformation: '',
        description: '',
        priority: 'MEDIUM',
      })
      setSelectedFiles([])
      setSuccess('Ticket created successfully.')
      await loadTickets()
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || requestError?.response?.data?.details?.join(', ')
        || 'Failed to create ticket.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files.slice(0, 3))
  }

  const updateStatus = async (ticket, nextStatus) => {
    setError('')
    setSuccess('')

    let payload = { status: nextStatus }

    if (nextStatus === 'REJECTED') {
      const rejectionReason = window.prompt('Enter rejection reason:')
      if (!rejectionReason || !rejectionReason.trim()) {
        setError('Rejection reason is required.')
        return
      }
      payload = { ...payload, rejectionReason: rejectionReason.trim() }
    }

    if (nextStatus === 'RESOLVED' || nextStatus === 'CLOSED') {
      const resolutionNotes = window.prompt(`Enter ${prettyLabel(nextStatus)} notes:`)
      if (!resolutionNotes || !resolutionNotes.trim()) {
        setError('Resolution notes are required.')
        return
      }
      payload = { ...payload, resolutionNotes: resolutionNotes.trim() }
    }

    setUpdatingTicketId(ticket.id)
    try {
      await ticketService.updateTicketStatus(ticket.id, payload)
      setSuccess(`Ticket status changed to ${prettyLabel(nextStatus)}.`)
      await loadTickets()
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError?.response?.data?.error
        || 'Failed to update ticket status.',
      )
    } finally {
      setUpdatingTicketId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200/80 bg-slate-100/85 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] md:p-6">
        <h2 className="font-display text-3xl font-bold text-slate-900">Incident Ticketing</h2>

        {canCreate ? (
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 h-5 w-5 text-slate-300" />
                <div>
                  <h3 className="text-2xl font-semibold">Create a new ticket</h3>
                  <p className="mt-1 text-sm text-slate-400">Fill in the details below to submit a support request</p>
                </div>
              </div>
            </div>

            <form className="space-y-5 px-6 py-6" onSubmit={handleCreateTicket}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Resource / Location</span>
                <input
                  type="text"
                  value={form.resourceOrLocation}
                  onChange={(event) => setForm((current) => ({ ...current, resourceOrLocation: event.target.value }))}
                  placeholder="Select a resource or location"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="e.g. Hardware, Network..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Preferred Contact</span>
                  <input
                    type="text"
                    value={form.contactInformation}
                    onChange={(event) => setForm((current) => ({ ...current, contactInformation: event.target.value }))}
                    placeholder="Email or phone"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</span>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, priority }))}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${priorityButtonClass(form.priority === priority)}`}
                    >
                      {prettyLabel(priority)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Attachments</span>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <Upload className="h-5 w-5 text-slate-500" />
                  <span className="mt-2 text-sm font-medium text-slate-700">Click to upload images</span>
                  <span className="mt-1 text-xs text-slate-500">PNG, JPG, GIF. Up to 3 files.</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelection} />
                </label>
                {selectedFiles.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file) => (
                      <p key={file.name} className="text-xs text-slate-600">{file.name}</p>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                <Wrench className="h-4 w-4" />
                {submitting ? 'Creating ticket...' : 'Create ticket'}
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Ticket creation is available for campus users. Staff can review and manage all tickets below.</p>
        )}
      </section>

      <section className="glass-panel p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search by category, location, reporter or status"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{prettyLabel(status)}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</span>
            <select
              value={filters.priority}
              onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{prettyLabel(priority)}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-slate-900">{canManage ? 'All Tickets' : 'My Tickets'}</h3>
          <span className="text-sm font-semibold text-slate-500">{filteredTickets.length} results</span>
        </div>

        {loading ? (
          <div className="glass-panel flex min-h-[220px] items-center justify-center p-6">
            <LoadingSpinner label="Loading tickets..." />
          </div>
        ) : null}

        {!loading && filteredTickets.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tickets found"
            description="Create a new incident ticket to get support started."
          />
        ) : null}

        {!loading && filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <article key={ticket.id} className="glass-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-lg font-bold text-slate-900">{prettyLabel(ticket.category)} Incident</h4>
                    <p className="mt-1 text-sm text-slate-600">{ticket.resourceOrLocation}</p>
                    <p className="mt-1 text-xs text-slate-500">Created: {formatDateTime(ticket.createdAt)}</p>
                    {canManage ? (
                      <p className="mt-1 text-xs text-slate-500">Reporter: {ticket.reporterName || 'User'} ({ticket.reporterEmail || 'N/A'})</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${priorityTagClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">{ticket.description}</p>
                <p className="mt-2 text-xs text-slate-500">Preferred contact: {ticket.contactInformation}</p>

                {ticket.attachmentUrls?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ticket.attachmentUrls.map((attachment) => (
                      <span key={attachment} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                        {attachment}
                      </span>
                    ))}
                  </div>
                ) : null}

                {ticket.rejectionReason ? (
                  <p className="mt-2 text-xs font-medium text-rose-700">Rejection reason: {ticket.rejectionReason}</p>
                ) : null}

                {ticket.resolutionNotes ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">Resolution notes: {ticket.resolutionNotes}</p>
                ) : null}

                {canManage && getStatusActions(ticket.status).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getStatusActions(ticket.status).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => updateStatus(ticket, action)}
                        disabled={updatingTicketId === ticket.id}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {updatingTicketId === ticket.id ? 'Updating...' : `Mark ${prettyLabel(action)}`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
