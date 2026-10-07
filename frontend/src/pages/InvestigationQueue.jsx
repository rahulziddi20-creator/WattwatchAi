import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import EmptyState from '../components/ui/EmptyState'
import { getQueue } from '../services/api'
import { fmt } from '../utils/formatters'
import { ChevronUp, ChevronDown } from 'lucide-react'

const AREAS = ['Rajouri', 'Udhampur', 'Reasi', 'Ramban', 'Bhaderwah', 'Doda', 'Kishtwar', 'Batote']
const LEVELS = ['Critical', 'High', 'Medium', 'Low']
const TYPES = ['Residential', 'Commercial', 'Industrial']

export default function InvestigationQueue() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterArea, setFilterArea] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    getQueue()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let data = items
    if (filterArea) data = data.filter((r) => r.area === filterArea)
    if (filterLevel) data = data.filter((r) => r.risk_level === filterLevel)
    if (filterType) data = data.filter((r) => r.connection_type === filterType)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter((r) =>
        r.consumer_id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)
      )
    }
    return [...data].sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey]
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, filterArea, filterLevel, filterType, search, sortKey, sortDir])

  function SortIcon({ k }) {
    if (sortKey !== k) return <span className="text-slate-300 ml-0.5">↕</span>
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline text-blue-500" /> : <ChevronDown size={12} className="inline text-blue-500" />
  }

  const TH = ({ label, k }) => (
    <th
      onClick={() => k && handleSort(k)}
      className={`px-3 py-2 text-left text-xs font-medium text-[#475569] whitespace-nowrap ${k ? 'cursor-pointer hover:text-[#0f172a]' : ''}`}
    >
      {label}{k && <SortIcon k={k} />}
    </th>
  )

  return (
    <PageShell title="Investigation Queue" subtitle="Flagged consumer accounts sorted by risk">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, name, area…"
          className="text-xs border border-[#e2e8f0] rounded px-2.5 py-1.5 w-52 focus:outline-none focus:border-blue-400"
        />
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
          className="text-xs border border-[#e2e8f0] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Risk Levels</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
          className="text-xs border border-[#e2e8f0] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Areas</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-xs border border-[#e2e8f0] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {(filterArea || filterLevel || filterType || search) && (
          <button onClick={() => { setFilterArea(''); setFilterLevel(''); setFilterType(''); setSearch('') }}
            className="text-xs text-slate-500 hover:text-red-600 px-2 py-1.5 border border-[#e2e8f0] rounded">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} records</span>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <div className="bg-white border border-[#e2e8f0] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f8f9fb] border-b border-[#e2e8f0]">
                  <TH label="Consumer ID" k="consumer_id" />
                  <TH label="Name" k="name" />
                  <TH label="Area" k="area" />
                  <TH label="Type" k="connection_type" />
                  <TH label="Current (kWh)" k="current_units" />
                  <TH label="Baseline" k="baseline_units" />
                  <TH label="Deviation" k="deviation_pct" />
                  <TH label="Risk Score" k="risk_score" />
                  <TH label="Risk Level" k="risk_level" />
                  <TH label="Primary Anomaly" />
                  <TH label="Status" k="status" />
                  <TH label="" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12}><EmptyState title="No records match filters" /></td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.consumer_id} className={`border-b border-[#f1f5f9] ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fb]'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 font-mono text-blue-600 font-medium">{row.consumer_id}</td>
                    <td className="px-3 py-2 font-medium text-[#0f172a]">{row.name}</td>
                    <td className="px-3 py-2 text-[#475569]">{row.area}</td>
                    <td className="px-3 py-2 text-[#475569]">{row.connection_type}</td>
                    <td className="px-3 py-2 font-mono">{(row.current_units || 0).toFixed(0)}</td>
                    <td className="px-3 py-2 font-mono text-[#475569]">{(row.baseline_units || 0).toFixed(0)}</td>
                    <td className={`px-3 py-2 font-mono font-medium ${row.deviation_pct < -30 ? 'text-red-600' : row.deviation_pct > 50 ? 'text-amber-600' : 'text-[#475569]'}`}>
                      {fmt.pct(row.deviation_pct)}
                    </td>
                    <td className="px-3 py-2 font-semibold">{(row.risk_score || 0).toFixed(1)}</td>
                    <td className="px-3 py-2"><RiskBadge level={row.risk_level} /></td>
                    <td className="px-3 py-2 text-[#475569] max-w-[140px] truncate">{row.primary_anomaly}</td>
                    <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  )
}
