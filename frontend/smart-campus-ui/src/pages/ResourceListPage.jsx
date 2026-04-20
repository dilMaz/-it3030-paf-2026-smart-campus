import { motion } from 'framer-motion'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AddResourceForm from '../components/resources/AddResourceForm'
import EditResourceForm from '../components/resources/EditResourceForm'
import ResourceFilterBar from '../components/resources/ResourceFilterBar'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { resourceService } from '../services/resourceService'

const defaultFilters = {
  type: '',
  location: '',
  minCapacity: '',
  status: '',
  query: '',
}

function prettyLabel(value) {
  if (!value) return '-'
  return value
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

function toEditInitialValues(resource) {
  return {
    ...resource,
    availableFrom: resource.availableFrom?.slice(0, 5),
    availableTo: resource.availableTo?.slice(0, 5),
  }
}

export default function ResourceListPage() {
  const { roles } = useAuth()
  const [resources, setResources] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  const isAdmin = useMemo(() => roles.includes('ADMIN'), [roles])

  const showMessage = (setFn, text) => {
    setFn(text)
    setTimeout(() => setFn(''), 2800)
  }

  const loadAllResources = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await resourceService.getAll()
      setResources(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load resources.')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllResources()
  }, [])

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { query, ...searchFilters } = filters
      const hasBackendFilters = Object.values(searchFilters).some((value) => value !== '')

      const data = hasBackendFilters
        ? await resourceService.search({
          ...searchFilters,
          minCapacity: searchFilters.minCapacity ? Number(searchFilters.minCapacity) : undefined,
        })
        : await resourceService.getAll()

      const normalizedQuery = query.trim().toLowerCase()
      const filtered = normalizedQuery
        ? data.filter((resource) => (
          resource.name?.toLowerCase().includes(normalizedQuery)
          || resource.location?.toLowerCase().includes(normalizedQuery)
          || resource.type?.toLowerCase().includes(normalizedQuery)
        ))
        : data

      setResources(filtered)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to search resources.')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = async () => {
    setFilters(defaultFilters)
    await loadAllResources()
  }

  const handleCreateResource = async (payload) => {
    setBusy(true)
    setError('')
    try {
      await resourceService.create(payload)
      setOpenCreate(false)
      await loadAllResources()
      showMessage(setSuccess, 'Resource created successfully.')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to create resource.')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateResource = async (payload) => {
    if (!editingResource) return
    setBusy(true)
    setError('')
    try {
      await resourceService.update(editingResource.id, payload)
      setEditingResource(null)
      await loadAllResources()
      showMessage(setSuccess, 'Resource updated successfully.')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update resource.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteResource = async (resource) => {
    const shouldDelete = window.confirm(`Delete "${resource.name}"?`)
    if (!shouldDelete) return

    setBusy(true)
    setError('')
    try {
      await resourceService.remove(resource.id)
      await loadAllResources()
      showMessage(setSuccess, 'Resource deleted successfully.')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to delete resource.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Facilities & Assets Catalogue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Maintain lecture halls, labs, meeting rooms, and equipment with searchable metadata.
            </p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          ) : null}
        </div>
      </motion.section>

      <section className="glass-panel p-6">
        <ResourceFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleResetFilters}
        />
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      {loading ? (
        <div className="glass-panel flex min-h-[220px] items-center justify-center p-6">
          <LoadingSpinner label="Loading resources..." />
        </div>
      ) : null}

      {!loading && resources.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No resources found"
          description="Try changing filters or add a new resource."
        />
      ) : null}

      {!loading && resources.length > 0 ? (
        <section className="space-y-4">
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Status</th>
                  {isAdmin ? <th className="px-4 py-3">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{resource.name}</td>
                    <td className="px-4 py-3">{prettyLabel(resource.type)}</td>
                    <td className="px-4 py-3">{resource.capacity}</td>
                    <td className="px-4 py-3">{resource.location}</td>
                    <td className="px-4 py-3">{resource.availableFrom} - {resource.availableTo}</td>
                    <td className="px-4 py-3"><StatusBadge tone={statusTone(resource.status)}>{prettyLabel(resource.status)}</StatusBadge></td>
                    {isAdmin ? (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingResource(resource)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(resource)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {resources.map((resource) => (
              <article key={resource.id} className="glass-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{resource.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{prettyLabel(resource.type)} | Capacity {resource.capacity}</p>
                    <p className="mt-1 text-sm text-slate-600">{resource.location}</p>
                    <p className="mt-1 text-xs text-slate-500">Available {resource.availableFrom} - {resource.availableTo}</p>
                  </div>
                  <StatusBadge tone={statusTone(resource.status)}>{prettyLabel(resource.status)}</StatusBadge>
                </div>
                {isAdmin ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingResource(resource)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(resource)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {openCreate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <AddResourceForm
              onSubmit={handleCreateResource}
              onCancel={() => setOpenCreate(false)}
              busy={busy}
            />
          </div>
        </div>
      ) : null}

      {editingResource ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <EditResourceForm
              initialValues={toEditInitialValues(editingResource)}
              onSubmit={handleUpdateResource}
              onCancel={() => setEditingResource(null)}
              busy={busy}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
