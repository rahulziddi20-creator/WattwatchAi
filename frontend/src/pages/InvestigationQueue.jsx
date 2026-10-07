import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import ScoreChip from '../components/ui/ScoreChip'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import EmptyState from '../components/ui/EmptyState'
import { getQueue } from '../services/api'
import { fmt } from '../utils/formatters'
import { ChevronUp, ChevronDown } from 'lucide-react'

const AREAS = ['Rajouri','Udhampur','Reasi','Ramban','Bhaderwah','Doda','Kishtwar','Batote']
const LEVELS = ['Critical','High','Medium','Low']
const TYPES  = ['Residential','Commercial','Industrial']
const STATUSES = ['Open','In Review','Escalated','Monitoring','Closed']

function DeviationCell({ pct }) {
  const n = pct || 0
  const color = n < -40 ? '#dc2626' : n < -20 ? '#ea580c' : n > 50 ? '#d97706' : '#6b7280'
  return <span style={{ color }} className="font-mono tabular-nums">{n > 0 ? '+' : ''}{n.toFixed(1)}%</span>
}

export default function InvestigationQueue() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch]         = useState('')
  const [filterLevel, setFilterLevel]   = useState('')
  const [filterArea, setFilterArea]     = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    getQueue()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let d = items
    if (filterLevel)  d = d.filter(r => r.risk_level === filterLevel)
    if (filterArea)   d = d.filter(r => r.area === filterArea)
    if (filterType)   d = d.filter(r => r.connection_type === filterType)
    if (filterStatus) d = d.filter(r => r.status === filterStatus)
    if (search) {
      const q = search.toLowerCase()
      d = d.filter(r => r.consumer_id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    }
    return [...d].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, search, filterLevel, filterArea, filterType, filterStatus, sortKey, sortDir])

  const SortIcon = ({ k }) => sortKey !== k ? null : (
    sortDir === 'asc' ? <ChevronUp size={11} className="inline ml-0.5 text-blue-500" />
                      : <ChevronDown size={11} className="inline ml-0.5 text-blue-500" />
  )

  const TH = ({ label, k }) => (
    <th onClick={() => k && handleSort(k)}
      className={`px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${k ? 'cursor-pointer hover:text-gray-800 select-none' : ''}`}>
      {label}<SortIcon k={k} />
    </th>
  )

  // Tab-level filter counts
  const levelCounts = useMemo(() => {
    const m = { All: items.length, Critical: 0, High: 0, Medium: 0, Low: 0 }
    items.forEach(r => { m[r.risk_level] = (m[r.risk_level] || 0) + 1 })
    return m
  }, [items])

  return (
    <PageShell title="Investigation Queue" subtitle="Work queue for fraud investigation cases">
      {/* Level tab filters */}
      <div className="flex items-center gap-1 mb-3">
        {['All','Critical','High','Medium','Low'].map(l => {
          const active = filterLevel === l || (l === 'All' && !filterLevel)
          const TCOLOR = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a', All: '#1d4ed8' }
          return (
            <button
              key={l}
              onClick={() => setFilterLevel(l === 'All' ? '' : l)}
              style={active ? { background: '#eff6ff', color: TCOLOR[l], borderColor: '#bfdbfe' } : {}}
              className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${active ? 'border' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              {l} <span className="ml-1 text-[10px] tabular-nums">({levelCounts[l] || 0})</span>
            </button>
          )
        })}
        <div className="ml-auto text-[11px] text-gray-400">{filtered.length} records</div>
      </div>

      {/* Additional filters */}
      <div className="flex flex-wrap gap-2 mb-3 bg-white border border-gray-200 rounded-lg p-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Consumer ID or name…"
          className="h-7 px-3 text-[12px] border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white w-44" />
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
          className="h-7 px-2 text-[12px] border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Areas</option>
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-7 px-2 text-[12px] border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-7 px-2 text-[12px] border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-400">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterArea || filterType || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterArea(''); setFilterType(''); setFilterStatus('') }}
            className="h-7 px-2.5 text-[11px] text-red-500 border border-red-200 bg-red-50 rounded hover:bg-red-100">
            Clear
          </button>
        )}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <TH label="Consumer ID" k="consumer_id" />
                  <TH label="Area" k="area" />
                  <TH label="Type" />
                  <TH label="Current Usage" k="current_units" />
                  <TH label="Historical Baseline" k="baseline_units" />
                  <TH label="Deviation" k="deviation_pct" />
                  <TH label="Risk Score" k="risk_score" />
                  <TH label="Primary Signal" />
                  <TH label="Case Status" k="status" />
                  <TH label="" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10}><EmptyState title="No cases match the current filters" /></td></tr>
                ) : filtered.map(row => (
                  <tr key={row.consumer_id} className="trow">
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-[12px] font-bold text-blue-600">{row.consumer_id}</div>
                      <div className="text-[11px] text-gray-400">{row.name}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-gray-600">{row.area}</td>
                    <td className="px-3 py-2.5 text-[12px] text-gray-500">{row.connection_type}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-gray-700">{(row.current_units||0).toFixed(0)} kWh</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-gray-400">{(row.baseline_units||0).toFixed(0)} kWh</td>
                    <td className="px-3 py-2.5"><DeviationCell pct={row.deviation_pct} /></td>
                    <td className="px-3 py-2.5"><ScoreChip score={row.risk_score} level={row.risk_level} /></td>
                    <td className="px-3 py-2.5 text-[12px] text-gray-500 max-w-[140px] truncate">{row.primary_anomaly}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap">
                        Investigate →
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
