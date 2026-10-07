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
import { ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react'

const AREAS = ['Rajouri','Udhampur','Reasi','Ramban','Bhaderwah','Doda','Kishtwar','Batote']
const LEVELS = ['Critical','High','Medium','Low']
const TYPES = ['Residential','Commercial','Industrial']

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

  const load = () => {
    setLoading(true)
    getQueue()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
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

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <span className="text-slate-300 ml-0.5 text-[10px]">↕</span>
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="inline text-blue-500 ml-0.5" />
      : <ChevronDown size={11} className="inline text-blue-500 ml-0.5" />
  }

  const TH = ({ label, k }) => (
    <th
      onClick={() => k && handleSort(k)}
      className={`px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap select-none ${k ? 'cursor-pointer hover:text-slate-800' : ''}`}
    >
      {label}{k && <SortIcon k={k} />}
    </th>
  )

  const hasFilters = filterArea || filterLevel || filterType || search

  return (
    <PageShell title="Investigation Queue" subtitle="Flagged consumer accounts requiring review" onRefresh={load}>
      {/* Filters bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, name or area…"
          className="text-[12px] border border-slate-200 rounded-md px-3 py-1.5 w-48 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Risk Levels</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Areas</option>
          {AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterArea(''); setFilterLevel(''); setFilterType(''); setSearch('') }}
            className="text-[11px] text-red-500 hover:text-red-700 px-2 py-1.5 border border-red-100 bg-red-50 rounded-md font-medium">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-400 font-medium">{filtered.length} records</span>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <TH label="Consumer ID" k="consumer_id" />
                  <TH label="Name" k="name" />
                  <TH label="Area" k="area" />
                  <TH label="Type" />
                  <TH label="Current kWh" k="current_units" />
                  <TH label="Baseline" k="baseline_units" />
                  <TH label="Deviation" k="deviation_pct" />
                  <TH label="Score" k="risk_score" />
                  <TH label="Risk Level" k="risk_level" />
                  <TH label="Primary Anomaly" />
                  <TH label="Status" k="status" />
                  <TH label="" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={12}><EmptyState title="No records match the applied filters" /></td></tr>
                ) : filtered.map((row) => (
                  <tr key={row.consumer_id} className="table-row-hover">
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-blue-600">{row.consumer_id}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{row.area}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{row.connection_type}</td>
                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-slate-700">{(row.current_units||0).toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-slate-400">{(row.baseline_units||0).toFixed(0)}</td>
                    <td className={`px-4 py-3 font-mono text-[12px] font-semibold tabular-nums ${row.deviation_pct < -30 ? 'text-red-600' : row.deviation_pct > 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {fmt.pct(row.deviation_pct)}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{(row.risk_score||0).toFixed(1)}</td>
                    <td className="px-4 py-3"><RiskBadge level={row.risk_level} /></td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 max-w-[150px] truncate">{row.primary_anomaly}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                        className="px-3 py-1.5 text-[11px] font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
