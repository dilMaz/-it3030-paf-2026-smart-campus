import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { facilityService } from '../services/facilityService'

export default function AdminDashboard() {
  const { roles } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, active: 0, outOfService: 0, capacity: 0 })
  const [resourceTypes, setResourceTypes] = useState([])

  useEffect(() => {
    if (!roles.includes('ADMIN')) {
      navigate('/')
      return
    }
    // Fetch resource stats
    facilityService.getFacilities().then((facilities) => {
      const total = facilities.length
      const active = facilities.filter(f => f.status === 'ACTIVE').length
      const outOfService = facilities.filter(f => f.status === 'OUT_OF_SERVICE').length
      const capacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0)
      setStats({ total, active, outOfService, capacity })
      // Resource types for chart
      const typeCounts = facilities.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1
        return acc
      }, {})
      setResourceTypes(Object.entries(typeCounts))
    })
  }, [roles, navigate])

  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-3xl font-bold mb-1 text-slate-900">Admin Dashboard</h1>
      <p className="text-slate-500 mb-8">Overview of campus resources, user management, and quick access to modules.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Resources" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Out Of Service" value={stats.outOfService} />
        <StatCard label="Total Capacity" value={stats.capacity} />
      </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 text-slate-900">Resource Types</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <PieChart data={resourceTypes} />
          <ul className="text-sm space-y-2">
            {resourceTypes.map(([type, count], i) => (
              <li key={type} className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full`} style={{ background: chartColors[i % chartColors.length] }} />
                <span className="font-semibold">{type}</span>
                <span className="ml-2 text-slate-500">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Add more admin modules/cards here as needed */}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
      <span className="text-slate-500 font-semibold mb-2">{label}</span>
      <span className="text-3xl font-bold text-slate-900">{value}</span>
    </div>
  )
}

const chartColors = [
  '#a78bfa', // purple
  '#34d399', // green
  '#60a5fa', // blue
  '#fbbf24', // yellow
  '#f87171', // red
]

function PieChart({ data }) {
  // Simple SVG pie chart
  const total = data.reduce((sum, [, count]) => sum + count, 0)
  let cumulative = 0
  const radius = 50
  const cx = 60
  const cy = 60
  const pie = data.map(([type, count], i) => {
    const value = (count / total) * 100
    const startAngle = (cumulative / total) * 360
    const endAngle = ((cumulative + count) / total) * 360
    cumulative += count
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    const start = polarToCartesian(cx, cy, radius, startAngle)
    const end = polarToCartesian(cx, cy, radius, endAngle)
    const d = [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ')
    return <path key={type} d={d} fill={chartColors[i % chartColors.length]} />
  })
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {pie}
    </svg>
  )
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}
