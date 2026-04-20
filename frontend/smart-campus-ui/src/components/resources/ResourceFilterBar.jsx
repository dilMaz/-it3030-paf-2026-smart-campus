import { Search } from 'lucide-react'
import { buildingFloors, buildingOptions } from './buildingFloors'

const resourceTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']
const resourceStatuses = ['ACTIVE', 'OUT_OF_SERVICE']

function prettyLabel(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ResourceFilterBar({ filters, onChange, onSearch, onReset }) {
  const floorOptions = filters.building ? buildingFloors[filters.building] || [] : []

  return (
    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={onSearch}>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Type</span>
        <select
          value={filters.type}
          onChange={(event) => onChange('type', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>{prettyLabel(type)}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Building</span>
        <select
          value={filters.building}
          onChange={(event) => onChange('building', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Buildings</option>
          {buildingOptions.map((building) => (
            <option key={building} value={building}>{building}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Floor</span>
        <select
          value={filters.floor}
          onChange={(event) => onChange('floor', event.target.value)}
          disabled={!filters.building}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">{filters.building ? 'All Floors' : 'Select building first'}</option>
          {floorOptions.map((floor) => (
            <option key={floor} value={floor}>{floor}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Min Capacity</span>
        <input
          type="number"
          min="1"
          value={filters.minCapacity}
          onChange={(event) => onChange('minCapacity', event.target.value)}
          placeholder="e.g. 50"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
        <select
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {resourceStatuses.map((status) => (
            <option key={status} value={status}>{prettyLabel(status)}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
            placeholder="Try type, building, or floor"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </label>

      <div className="md:col-span-2 xl:col-span-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
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
  )
}
