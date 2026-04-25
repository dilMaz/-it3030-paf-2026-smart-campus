import { motion } from 'framer-motion'
import { Building2, Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatusBadge from '../components/ui/StatusBadge'
import { API_BASE_URL } from '../config/env'
import { useAuth } from '../hooks/useAuth'
import { facilityService } from '../services/facilityService'
import { resourceService } from '../services/resourceService'

const facilityTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const facilityStatuses = ['ACTIVE', 'OUT_OF_SERVICE']
const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const filterDebounceMs = 300
const maxCapacity = 250

const lectureHallsByBuilding = {
  'Main Building': ['A401', 'A402', 'A403', 'A405', 'A502', 'B201', 'B403', 'B501'],
  'New Building': ['F301', 'F304', 'F503', 'F603', 'F204', 'F704', 'G201', 'G305', 'G1303', 'G406', 'G706'],
}

const buildingOptions = Object.keys(lectureHallsByBuilding)

function defaultBuilding() {
  return buildingOptions[0]
}

function defaultHallForBuilding(building) {
  return lectureHallsByBuilding[building]?.[0] || ''
}

const emptyFormState = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  building: defaultBuilding(),
  location: defaultHallForBuilding(defaultBuilding()),
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
  const { building, hall } = parseLocationSelection(facility.location)

  return {
    name: facility.name ?? '',
    type: facility.type ?? 'LECTURE_HALL',
    capacity: facility.capacity ? String(facility.capacity) : '',
    building,
    location: hall,
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

function parseLocationSelection(rawLocation) {
  const location = String(rawLocation || '').trim()
  const availableBuildings = Object.keys(lectureHallsByBuilding)
  const fallbackBuilding = availableBuildings[0]

  if (!location) {
    return {
      building: fallbackBuilding,
      hall: defaultHallForBuilding(fallbackBuilding),
    }
  }

  // Support common persisted formats: "Building - Hall", "Building-Hall", "Building: Hall".
  const splitMatch = location.split(/\s*[-:]\s*/)
  if (splitMatch.length >= 2) {
    const candidateBuilding = splitMatch[0]
    const candidateHall = splitMatch.slice(1).join('-')
    if (lectureHallsByBuilding[candidateBuilding]?.includes(candidateHall)) {
      return {
        building: candidateBuilding,
        hall: candidateHall,
      }
    }
  }

  const matchedBuilding = availableBuildings.find((building) => lectureHallsByBuilding[building].includes(location))
  if (matchedBuilding) {
    return {
      building: matchedBuilding,
      hall: location,
    }
  }

  return {
    building: fallbackBuilding,
    hall: defaultHallForBuilding(fallbackBuilding),
  }
}

function normalizeDisplayItem(item, sourceType) {
  return {
    ...item,
    sourceType,
    uniqueId: `${sourceType.toLowerCase()}-${item.id}`,
  }
}

function matchesText(value, searchTerm) {
  return String(value || '').toLowerCase().includes(searchTerm)
}

function matchesFilterSet(item, filters) {
  const searchTerm = filters.search.trim().toLowerCase()

  if (filters.type && item.type !== filters.type) {
    return false
  }

  if (filters.status && item.status !== filters.status) {
    return false
  }

  if (filters.minCapacity && Number(item.capacity || 0) < Number(filters.minCapacity)) {
    return false
  }

  if (filters.location && !matchesText(item.location, filters.location.trim().toLowerCase())) {
    return false
  }

  if (!searchTerm) {
    return true
  }

  return [item.name, item.location, item.description, item.type, item.sourceType]
    .filter(Boolean)
    .some((value) => matchesText(value, searchTerm))
}

function formatResourceAvailability(resource) {
  if (resource.sourceType === 'Resource' && (resource.availableFrom || resource.availableTo)) {
    const from = resource.availableFrom ? new Date(resource.availableFrom).toLocaleString() : 'Open'
    const to = resource.availableTo ? new Date(resource.availableTo).toLocaleString() : 'Open'
    return `${from} - ${to}`
  }

  if (Array.isArray(resource.availabilityWindows) && resource.availabilityWindows.length > 0) {
    return resource.availabilityWindows
      .map((window) => `${prettyLabel(window.dayOfWeek)} ${window.startTime}-${window.endTime}`)
      .join(' · ')
  }

  return resource.sourceType === 'Resource' ? 'Resource record' : 'No availability windows'
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${API_BASE_URL}${imageUrl}`
}

function createImagePreview(file) {
  if (!file) return ''
  return URL.createObjectURL(file)
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
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingFacilityId, setEditingFacilityId] = useState(null)
  const [formState, setFormState] = useState(emptyFormState)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  const role = useMemo(() => {
    if (roles.includes('ADMIN')) return 'ADMIN'
    if (roles.includes('TECHNICIAN')) return 'TECHNICIAN'
    return 'USER'
  }, [roles])

  const canManageFacilities = role === 'ADMIN'

  const loadCatalogue = useCallback(async (activeFilters) => {
    setLoading(true)
    setError('')
    try {
      const [facilityData, resourceData] = await Promise.all([
        facilityService.getFacilities(activeFilters),
        resourceService.getAll(),
      ])
      setFacilities(Array.isArray(facilityData) ? facilityData : [])
      setResources(Array.isArray(resourceData) ? resourceData : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to load facilities.')
      setFacilities([])
      setResources([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCatalogue(filters)
    }, filterDebounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [filters, loadCatalogue])

  const handleApplyFilters = async (event) => {
    event.preventDefault()
    await loadCatalogue(filters)
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
    setImageFile(null)
    setImagePreview('')
    setOpenForm(true)
  }

  const openEditFormFor = (facility) => {
    setEditingFacilityId(facility.id)
    setFormState(mapFacilityToFormState(facility))
    setImageFile(null)
    setImagePreview(resolveImageUrl(facility.imageUrl) || '')
    setOpenForm(true)
  }

  const closeForm = () => {
    setOpenForm(false)
    setSaving(false)
    setEditingFacilityId(null)
    setFormState(emptyFormState)
    setImageFile(null)
    setImagePreview('')
  }

  const handleFormFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleBuildingChange = (building) => {
    setFormState((current) => ({
      ...current,
      building,
      location: defaultHallForBuilding(building),
    }))
  }

  const handleImageChange = (file) => {
    setImageFile(file || null)

    setImagePreview((currentPreview) => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview)
      }

      if (!file) {
        return ''
      }

      return createImagePreview(file)
    })
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
    location: `${formState.building} - ${formState.location}`,
    status: formState.status,
    description: formState.description.trim() || null,
    availabilityWindows: formState.availabilityWindows.map((window) => ({
      dayOfWeek: window.dayOfWeek,
      startTime: window.startTime,
      endTime: window.endTime,
    })),
  })

  const validateFacilityForm = () => {
    if (!/^[A-Za-z\s]+$/.test(formState.name.trim())) {
      return 'Facility name should contain letters and spaces only.'
    }

    const numericCapacity = Number(formState.capacity)
    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      return 'Capacity must be at least 1.'
    }

    if (numericCapacity > maxCapacity) {
      return `Capacity cannot exceed ${maxCapacity}.`
    }

    if (!formState.building || !formState.location) {
      return 'Please select a building and lecture hall.'
    }

    return ''
  }

  const handleSaveFacility = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const validationError = validateFacilityForm()
    if (validationError) {
      setError(validationError)
      setSaving(false)
      return
    }

    try {
      const payload = buildPayload()
      let savedFacility

      if (editingFacilityId) {
        savedFacility = await facilityService.updateFacility(editingFacilityId, payload)
      } else {
        savedFacility = await facilityService.createFacility(payload)
      }

      if (imageFile && savedFacility?.id) {
        await facilityService.uploadFacilityImage(savedFacility.id, imageFile)
      }

      closeForm()
      await loadCatalogue(filters)
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
      await loadCatalogue(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to delete facility.')
    }
  }

  const handleToggleStatus = async (facility) => {
    const nextStatus = facility.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
    setError('')
    try {
      await facilityService.updateFacilityStatus(facility.id, nextStatus)
      await loadCatalogue(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to update facility status.')
    }
  }

  const handleUploadImage = async (facility, file) => {
    if (!file) return

    setError('')
    try {
      if (facility.sourceType === 'Resource') {
        await resourceService.uploadResourceImage(facility.id, file)
      } else {
        await facilityService.uploadFacilityImage(facility.id, file)
      }
      await loadCatalogue(filters)
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to upload image.')
    }
  }

  useEffect(() => () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const availableLectureHalls = useMemo(() => {
    if (lectureHallsByBuilding[formState.building]?.length) {
      return lectureHallsByBuilding[formState.building]
    }

    const fallback = defaultBuilding()
    return lectureHallsByBuilding[fallback] || []
  }, [formState.building])

  useEffect(() => {
    const nextBuilding = lectureHallsByBuilding[formState.building] ? formState.building : defaultBuilding()
    const hallsForBuilding = lectureHallsByBuilding[nextBuilding] || []
    const nextHall = hallsForBuilding.includes(formState.location)
      ? formState.location
      : (hallsForBuilding[0] || '')

    if (nextBuilding !== formState.building || nextHall !== formState.location) {
      setFormState((current) => ({
        ...current,
        building: nextBuilding,
        location: nextHall,
      }))
    }
  }, [formState.building, formState.location])

  const displayFacilities = useMemo(
    () => facilities.map((facility) => normalizeDisplayItem(facility, 'Facility')),
    [facilities],
  )

  const displayResources = useMemo(
    () => resources
      .map((resource) => normalizeDisplayItem(resource, 'Resource'))
      .filter((item) => matchesFilterSet(item, filters)),
    [filters, resources],
  )

  const displayItems = [...displayFacilities, ...displayResources]

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

        {!loading && displayItems.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No facilities found"
            description="Try changing the filters or add a new resource to start your campus catalogue."
          />
        ) : null}

        {!loading && displayItems.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {displayItems.map((facility, index) => (
              <motion.article
                key={facility.uniqueId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-panel overflow-hidden p-0"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {resolveImageUrl(facility.imageUrl) ? (
                    <img src={resolveImageUrl(facility.imageUrl)} alt={facility.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                      <div className="text-center">
                        <Building2 className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider">No image added</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span className="rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {facility.sourceType}
                    </span>
                    <StatusBadge tone={statusTone(facility.status)}>{prettyLabel(facility.status)}</StatusBadge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-slate-900">{facility.name}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {prettyLabel(facility.type)} - {facility.capacity} capacity
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{facility.location}</p>
                    </div>
                  </div>

                  {facility.description ? (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {facility.description}
                    </p>
                  ) : null}

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Availability</p>
                    <div className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                      {formatResourceAvailability(facility)}
                    </div>
                  </div>

                  {canManageFacilities ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          handleUploadImage(facility, file)
                          event.target.value = ''
                        }}
                      />
                    </label>
                    {facility.sourceType === 'Facility' ? (
                      <>
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
                          className="soft-delete-button px-3 py-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        ) : null}
      </section>

      {openForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
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

            <form className="flex-1 space-y-4 overflow-y-auto pr-1" onSubmit={handleSaveFacility}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</span>
                  <input
                    required
                    type="text"
                    value={formState.name}
                    onChange={(event) => handleFormFieldChange('name', event.target.value.replace(/\d/g, ''))}
                    placeholder="Letters only"
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
                    max={maxCapacity}
                    type="number"
                    value={formState.capacity}
                    onChange={(event) => handleFormFieldChange('capacity', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">Maximum capacity is {maxCapacity}.</p>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Building</span>
                  <select
                    required
                    value={formState.building}
                    onChange={(event) => handleBuildingChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {buildingOptions.map((building) => (
                      <option key={building} value={building}>{building}</option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Lecture Hall</span>
                  <select
                    key={formState.building}
                    required
                    value={formState.location}
                    onChange={(event) => handleFormFieldChange('location', event.target.value)}
                    disabled={!availableLectureHalls.length}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    {availableLectureHalls.map((hall) => (
                      <option key={hall} value={hall}>{hall}</option>
                    ))}
                  </select>
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

                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Facility Image</h4>
                      <p className="mt-1 text-xs text-slate-500">Upload a photo that users will see in the catalogue.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleImageChange(event.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Selected facility preview" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-center text-slate-400">
                        <div>
                          <Building2 className="mx-auto h-10 w-10" />
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wider">No image selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
