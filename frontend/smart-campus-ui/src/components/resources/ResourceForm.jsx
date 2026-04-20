import { useMemo, useState } from 'react'

const types = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const statuses = ['ACTIVE', 'OUT_OF_SERVICE']

const defaultState = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  availableFrom: '08:00',
  availableTo: '17:00',
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

function mapInitialValues(initialValues = {}) {
  return {
    ...defaultState,
    ...initialValues,
    capacity: initialValues.capacity ? String(initialValues.capacity) : '',
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

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required'
    if (!values.location.trim()) nextErrors.location = 'Location is required'
    if (!values.capacity || Number(values.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1'
    if (!values.availableFrom) nextErrors.availableFrom = 'Available from is required'
    if (!values.availableTo) nextErrors.availableTo = 'Available to is required'
    if (values.availableFrom && values.availableTo && values.availableFrom >= values.availableTo) {
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
      location: values.location.trim(),
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
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
          <input
            type="text"
            value={values.location}
            onChange={(event) => setField('location', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.location ? <p className="mt-1 text-xs text-rose-600">{errors.location}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Available From</span>
          <input
            type="time"
            value={values.availableFrom}
            onChange={(event) => setField('availableFrom', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.availableFrom ? <p className="mt-1 text-xs text-rose-600">{errors.availableFrom}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Available To</span>
          <input
            type="time"
            value={values.availableTo}
            onChange={(event) => setField('availableTo', event.target.value)}
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
