import { useMemo, useState } from 'react'
import { buildingFloors, buildingOptions } from './buildingFloors'

const types = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const statuses = ['ACTIVE', 'OUT_OF_SERVICE']

function toDateTimeInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function normalizeDateTimeValue(value) {
  if (!value) return ''
  const raw = String(value)
  if (raw.includes('T') && raw.length >= 16) {
    return raw.slice(0, 16)
  }
  return toDateTimeInputValue(raw)
}

const defaultState = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  building: '',
  floor: '',
  availableFrom: toDateTimeInputValue(),
  availableTo: toDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)),
  status: 'ACTIVE',
  description: '',
}

function prettyLabel(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseLocation(location) {
  if (!location || typeof location !== 'string') {
    return { building: '', floor: '' }
  }

  const normalizedLocation = location.toUpperCase()

  for (const building of buildingOptions) {
    const floors = buildingFloors[building] || []
    for (const floor of floors) {
      if (normalizedLocation.includes(building.toUpperCase()) && normalizedLocation.includes(floor.toUpperCase())) {
        return { building, floor }
      }
    }
  }

  for (const building of buildingOptions) {
    const floors = buildingFloors[building] || []
    const matchedFloor = floors.find((floor) => normalizedLocation.includes(floor.toUpperCase()))
    if (matchedFloor) {
      return { building, floor: matchedFloor }
    }
  }

  return { building: '', floor: '' }
}

function mapInitialValues(initialValues = {}) {
  const parsedLocation = parseLocation(initialValues.location)

  return {
    ...defaultState,
    ...initialValues,
    building: parsedLocation.building,
    floor: parsedLocation.floor,
    capacity: initialValues.capacity ? String(initialValues.capacity) : '',
    availableFrom: normalizeDateTimeValue(initialValues.availableFrom) || defaultState.availableFrom,
    availableTo: normalizeDateTimeValue(initialValues.availableTo) || defaultState.availableTo,
  }
}

export default function ResourceForm({
  title,
  submitLabel,
  initialValues,
  onSubmit,
  onCancel,
  busy = false,
}) {
  const [values, setValues] = useState(() => mapInitialValues(initialValues))
  const [errors, setErrors] = useState({})
  const floorOptions = values.building ? buildingFloors[values.building] || [] : []
  const nowInputValue = useMemo(() => toDateTimeInputValue(), [])

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  const setField = (field, value) => {
    setValues((current) => {
      if (field === 'building') {
        return { ...current, building: value, floor: '' }
      }

      return { ...current, [field]: value }
    })

    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]

      if (field === 'building' && next.floor) {
        delete next.floor
      }

      return next
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required'
    if (!values.building) nextErrors.building = 'Building is required'
    if (!values.floor) nextErrors.floor = 'Floor is required'
    if (!values.capacity || Number(values.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1'
    if (!values.availableFrom) nextErrors.availableFrom = 'Available from is required'
    if (!values.availableTo) nextErrors.availableTo = 'Available to is required'
    const fromDate = values.availableFrom ? new Date(values.availableFrom) : null
    const toDate = values.availableTo ? new Date(values.availableTo) : null
    const nowDate = new Date()
    nowDate.setSeconds(0, 0)

    if (fromDate && Number.isNaN(fromDate.getTime())) nextErrors.availableFrom = 'Enter a valid date and time'
    if (toDate && Number.isNaN(toDate.getTime())) nextErrors.availableTo = 'Enter a valid date and time'
    if (fromDate && !Number.isNaN(fromDate.getTime()) && fromDate < nowDate) {
      nextErrors.availableFrom = 'Available from cannot be in the past'
    }
    if (toDate && !Number.isNaN(toDate.getTime()) && toDate < nowDate) {
      nextErrors.availableTo = 'Available to cannot be in the past'
    }
    if (fromDate && toDate && fromDate >= toDate) {
      nextErrors.availableTo = 'Available to must be after available from'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      name: values.name.trim(),
      type: values.type,
      capacity: Number(values.capacity),
      location: `${values.building} - ${values.floor}`,
      availableFrom: values.availableFrom,
      availableTo: values.availableTo,
      status: values.status,
      description: values.description.trim() || null,
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Type</span>
          <select
            value={values.type}
            onChange={(event) => setField('type', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {types.map((type) => (
              <option key={type} value={type}>{prettyLabel(type)}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Capacity</span>
          <input
            type="number"
            min="1"
            value={values.capacity}
            onChange={(event) => setField('capacity', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.capacity ? <p className="mt-1 text-xs text-rose-600">{errors.capacity}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Building</span>
          <select
            value={values.building}
            onChange={(event) => setField('building', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select building</option>
            {buildingOptions.map((building) => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>
          {errors.building ? <p className="mt-1 text-xs text-rose-600">{errors.building}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Floor</span>
          <select
            value={values.floor}
            onChange={(event) => setField('floor', event.target.value)}
            disabled={!values.building}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">{values.building ? 'Select floor' : 'Select building first'}</option>
            {floorOptions.map((floor) => (
              <option key={floor} value={floor}>{floor}</option>
            ))}
          </select>
          {errors.floor ? <p className="mt-1 text-xs text-rose-600">{errors.floor}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Available From</span>
          <input
            type="datetime-local"
            value={values.availableFrom}
            onChange={(event) => setField('availableFrom', event.target.value)}
            min={nowInputValue}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.availableFrom ? <p className="mt-1 text-xs text-rose-600">{errors.availableFrom}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Available To</span>
          <input
            type="datetime-local"
            value={values.availableTo}
            onChange={(event) => setField('availableTo', event.target.value)}
            min={values.availableFrom || nowInputValue}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.availableTo ? <p className="mt-1 text-xs text-rose-600">{errors.availableTo}</p> : null}
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
          <select
            value={values.status}
            onChange={(event) => setField('status', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{prettyLabel(status)}</option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</span>
          <textarea
            rows={3}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !isValid}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
