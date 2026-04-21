import { motion } from 'framer-motion'
import { Building2, Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { facilityService } from '../services/facilityService'

const facilityTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const facilityStatuses = ['ACTIVE', 'OUT_OF_SERVICE']
const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const filterDebounceMs = 300

const emptyFormState = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  status: 'ACTIVE',
  description: '',
  availabilityWindows: [{ dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }],
}

function prettyLabel(value) {
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

function mapFacilityToFormState(facility) {
  return {
    name: facility.name ?? '',
    type: facility.type ?? 'LECTURE_HALL',
    capacity: facility.capacity ? String(facility.capacity) : '',
    location: facility.location ?? '',
    status: facility.status ?? 'ACTIVE',
    description: facility.description ?? '',
    availabilityWindows: (facility.availabilityWindows?.length
      ? facility.availabilityWindows
      : [{ dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }]
    ).map((window) => ({
      dayOfWeek: window.dayOfWeek ?? 'MONDAY',
      startTime: window.startTime ?? '08:00',
      endTime: window.endTime ?? '17:00',
    })),
  }
}

export default function FacilitiesPage() {
  const { roles } = useAuth()
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    minCapacity: '',
    status: '',
  })
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingFacilityId, setEditingFacilityId] = useState(null)
  const [formState, setFormState] = useState(emptyFormState)
  const [saving, setSaving] = useState(false)

  const role = useMemo(() => {
    if (roles.includes('ADMIN')) return 'ADMIN'
    if (roles.includes('TECHNICIAN')) return 'TECHNICIAN'
    return 'USER'
  }, [roles])

  const canManageFacilities = role === 'ADMIN'

  const loadFacilities = useCallback(async (activeFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await facilityService.getFacilities(activeFilters)
      setFacilities(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to load facilities.')
      setFacilities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadFacilities(filters)
    }, filterDebounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [filters, loadFacilities])

  const handleApplyFilters = async (event) => {
    event.preventDefault()
    await loadFacilities(filters)
  }

  const handleResetFilters = async () => {
    setFilters({ search: '', type: '', location: '', minCapacity: '', status: '' })
  }

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const openCreateForm = () => {
    setEditingFacilityId(null)
    setFormState(emptyFormState)
    setOpenForm(true)
  }

  const openEditFormFor = (facility) => {
    setEditingFacilityId(facility.id)
    setFormState(mapFacilityToFormState(facility))
    setOpenForm(true)
  }

  const closeForm = () => {
    setOpenForm(false)
    setSaving(false)
    setEditingFacilityId(null)
    setFormState(emptyFormState)
  }

  const handleFormFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleWindowChange = (index, field, value) => {
    setFormState((current) => {
      const nextWindows = [...current.availabilityWindows]
      nextWindows[index] = { ...nextWindows[index], [field]: value }
      return { ...current, availabilityWindows: nextWindows }
    })
  }

  const addWindow = () => {
    setFormState((current) => ({
      ...current,
      availabilityWindows: [...current.availabilityWindows, { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }],
    }))
  }

  const removeWindow = (index) => {
    setFormState((current) => {
      if (current.availabilityWindows.length === 1) {
        return current
      }
      const nextWindows = current.availabilityWindows.filter((_, windowIndex) => windowIndex !== index)
      return { ...current, availabilityWindows: nextWindows }
    })
  }

  const buildPayload = () => ({
    name: formState.name.trim(),
    type: formState.type,
    capacity: Number(formState.capacity),
    location: formState.location.trim(),
    status: formState.status,
    description: formState.description.trim() || null,
    availabilityWindows: formState.availabilityWindows.map((window) => ({
      dayOfWeek: window.dayOfWeek,
      startTime: window.startTime,
      endTime: window.endTime,
    })),
  })

  const handleSaveFacility = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = buildPayload()
      if (editingFacilityId) {
        await facilityService.updateFacility(editingFacilityId, payload)
      } else {
        await facilityService.createFacility(payload)
      }
      closeForm()
      await loadFacilities(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to save facility.')
      setSaving(false)
    }
  }

  const handleDeleteFacility = async (facilityId) => {
    const shouldDelete = window.confirm('Delete this facility permanently?')
    if (!shouldDelete) {
      return
    }

    setError('')
    try {
      await facilityService.deleteFacility(facilityId)
      await loadFacilities(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to delete facility.')
    }
  }

  const handleToggleStatus = async (facility) => {
    const nextStatus = facility.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
    setError('')
    try {
      await facilityService.updateFacilityStatus(facility.id, nextStatus)
      await loadFacilities(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to update facility status.')
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Facilities & Assets Catalogue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Search and manage lecture halls, labs, meeting rooms, and equipment with live availability windows.
            </p>
          </div>
          {canManageFacilities ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Facility
            </button>
          ) : null}
        </div>
      </motion.section>

      <section className="glass-panel p-6">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleApplyFilters}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Name, location, description"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Type</span>
            <select
              value={filters.type}
              onChange={(event) => handleFilterChange('type', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              {facilityTypes.map((type) => (
                <option key={type} value={type}>{prettyLabel(type)}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
            <input
              type="text"
              value={filters.location}
              onChange={(event) => handleFilterChange('location', event.target.value)}
              placeholder="Building / floor"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Min Capacity</span>
            <input
              type="number"
              min="1"
              value={filters.minCapacity}
              onChange={(event) => handleFilterChange('minCapacity', event.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {facilityStatuses.map((status) => (
                <option key={status} value={status}>{prettyLabel(status)}</option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 xl:col-span-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section>
        {loading ? (
          <div className="glass-panel flex min-h-[220px] items-center justify-center p-6">
            <LoadingSpinner label="Loading facilities..." />
          </div>
        ) : null}

        {!loading && facilities.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No facilities found"
            description="Try changing the filters or add a new resource to start your campus catalogue."
          />
        ) : null}

        {!loading && facilities.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {facilities.map((facility, index) => (
              <motion.article
                key={facility.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-panel p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{facility.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {prettyLabel(facility.type)} - {facility.capacity} capacity
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{facility.location}</p>
                  </div>
                  <StatusBadge tone={statusTone(facility.status)}>{prettyLabel(facility.status)}</StatusBadge>
                </div>

                {facility.description ? (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {facility.description}
                  </p>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Availability windows</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(facility.availabilityWindows || []).map((window, windowIndex) => (
                      <span
                        key={`${facility.id}-${windowIndex}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {prettyLabel(window.dayOfWeek)} {window.startTime}-{window.endTime}
                      </span>
                    ))}
                  </div>
                </div>

                {canManageFacilities ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditFormFor(facility)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(facility)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Mark {facility.status === 'ACTIVE' ? 'Out of Service' : 'Active'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFacility(facility.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </motion.article>
            ))}
          </div>
        ) : null}
      </section>

      {openForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {editingFacilityId ? 'Edit Facility' : 'Create Facility'}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Provide metadata, status, and weekly availability windows.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveFacility}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</span>
                  <input
                    required
                    type="text"
                    value={formState.name}
                    onChange={(event) => handleFormFieldChange('name', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Type</span>
                  <select
                    value={formState.type}
                    onChange={(event) => handleFormFieldChange('type', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {facilityTypes.map((type) => (
                      <option key={type} value={type}>{prettyLabel(type)}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Capacity</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={formState.capacity}
                    onChange={(event) => handleFormFieldChange('capacity', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
                  <input
                    required
                    type="text"
                    value={formState.location}
                    onChange={(event) => handleFormFieldChange('location', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
                  <select
                    value={formState.status}
                    onChange={(event) => handleFormFieldChange('status', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {facilityStatuses.map((status) => (
                      <option key={status} value={status}>{prettyLabel(status)}</option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</span>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(event) => handleFormFieldChange('description', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">Availability Windows</h4>
                  <button
                    type="button"
                    onClick={addWindow}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-3 w-3" />
                    Add Window
                  </button>
                </div>

                <div className="space-y-3">
                  {formState.availabilityWindows.map((window, index) => (
                    <div key={`window-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <select
                        value={window.dayOfWeek}
                        onChange={(event) => handleWindowChange(index, 'dayOfWeek', event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        {daysOfWeek.map((day) => (
                          <option key={day} value={day}>{prettyLabel(day)}</option>
                        ))}
                      </select>
                      <input
                        required
                        type="time"
                        value={window.startTime}
                        onChange={(event) => handleWindowChange(index, 'startTime', event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        required
                        type="time"
                        value={window.endTime}
                        onChange={(event) => handleWindowChange(index, 'endTime', event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeWindow(index)}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingFacilityId ? 'Update Facility' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
