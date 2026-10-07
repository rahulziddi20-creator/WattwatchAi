import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import KpiCard from '../components/ui/KpiCard'
import ScoreChip from '../components/ui/ScoreChip'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AnomalyTrendChart from '../components/charts/AnomalyTrendChart'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getDashboard, getTrends, getAreas } from '../services/api'
import { fmt } from '../utils/formatters'
import { ArrowRight, AlertTriangle, TrendingDown } from 'lucide-react'

const RISK_DIST_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }

function DeviationCell({ pct }) {
  const n = pct || 0
  const color = n < -40 ? '#dc2626' : n < -20 ? '#ea580c' : n > 50 ? '#d97706' : '#6b7280'
  return <span style={{ color }} className="font-mono tabular-nums font-medium">{n > 0 ? '+' : ''}{n.toFixed(1)}%</span>
}

export default function Overview() {
  const navigate = useNavigate()
  const [dash, setDash] = useState(null)
  const [trends, setTrends] = useState(null)
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getDashboard(), getTrends(), getAreas()])
      .then(([d, t, a]) => { setDash(d); setTrends(t); setAreas(a) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Overview"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Overview"><ErrorBanner message={error} /></PageShell>

  const { stats, priority_list, risk_distribution } = dash
  const totalFlagged = stats.anomalies_detected
  const flaggedPct = ((totalFlagged / stats.total_consumers) * 100).toFixed(1)

  return (
    <PageShell title="Overview" subtitle="Detect · Prioritize · Investigate · Act">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Consumers" value={fmt.number(stats.total_consumers)} sub="Accounts under monitoring" />
        <KpiCard label="Flagged Accounts" value={fmt.number(totalFlagged)} color="text-amber-600" sub={`${flaggedPct}% of portfolio`} />
        <KpiCard label="Critical Cases" value={fmt.number(stats.critical_count)} color="text-red-600" sub="Immediate action required" />
        <KpiCard label="Revenue at Risk" value={fmt.currency(stats.revenue_at_risk)} color="text-red-700" sub="High + Critical consumers" />
      </div>

      {/* Charts + Risk dist row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[12px] font-semibold text-gray-700 mb-3">Monthly Anomaly Trend</p>
          {trends && <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[12px] font-semibold text-gray-700 mb-3">Risk Distribution</p>
          <div className="space-y-2.5">
            {Object.entries(risk_distribution).map(([level, count]) => {
              const pct = Math.round((count / stats.total_consumers) * 100)
              const color = RISK_DIST_COLORS[level] || '#9ca3af'
              return (
                <div key={level}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-600 font-medium">{level}</span>
                    <span className="text-gray-400 tabular-nums">{count} accounts ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Priority investigations */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Priority Investigations</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Highest-risk accounts requiring immediate attention</p>
          </div>
          <button onClick={() => navigate('/queue')}
            className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800 font-medium">
            View queue <ArrowRight size={12} />
          </button>
        </div>
        <table>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Consumer','Area','Risk Score','Deviation','Primary Signal','Status',''].map(h => (
                <th key={h} className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {priority_list.map(row => (
              <tr key={row.consumer_id} className="trow">
                <td className="px-4 py-2.5">
                  <div className="font-mono text-[12px] font-bold text-blue-600">{row.consumer_id}</div>
                  <div className="text-[11px] text-gray-500">{row.name}</div>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-gray-600">{row.area}</td>
                <td className="px-4 py-2.5"><ScoreChip score={row.risk_score} level={row.risk_level} /></td>
                <td className="px-4 py-2.5">
                  <DeviationCell pct={row.deviation_pct} />
                </td>
                <td className="px-4 py-2.5 text-[12px] text-gray-500 max-w-[160px] truncate">{row.primary_anomaly}</td>
                <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-2.5">
                  <button onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700">
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom row: area risk + alerts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[12px] font-semibold text-gray-700 mb-3">Area Risk Overview</p>
          <AreaHeatmap areas={areas} />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {areas.slice(0, 4).map(a => (
              <div key={a.area} className="bg-gray-50 border border-gray-100 rounded p-2 text-center">
                <p className="text-[12px] font-semibold text-gray-700">{a.area}</p>
                <p className="text-[11px] text-orange-500 font-medium">{a.flagged_count} flagged</p>
                <p className="text-[10px] text-gray-400">{a.critical} critical</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-amber-500" />
            <p className="text-[12px] font-semibold text-gray-700">Recent Alerts</p>
          </div>
          <div className="space-y-2">
            {[
              { level: 'Critical', msg: `${priority_list[0]?.consumer_id} — ${priority_list[0]?.primary_anomaly}`, time: 'Just now' },
              { level: 'High',     msg: `${stats.high_risk_count} accounts need field inspection`, time: '2m ago' },
              { level: 'Medium',   msg: `${totalFlagged} anomalies detected this cycle`, time: '5m ago' },
              { level: 'Low',      msg: `Pipeline complete — ${stats.total_consumers} records analyzed`, time: '10m ago' },
            ].map((a, i) => {
              const C = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }[a.level]
              return (
                <div key={i} className="flex items-start gap-2 pb-2 border-b border-gray-50 last:border-0">
                  <TrendingDown size={12} style={{ color: C }} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 truncate">{a.msg}</p>
                    <p className="text-[10px] text-gray-400">{a.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
