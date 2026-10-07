import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import StatCard from '../components/ui/StatCard'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AnomalyTrendChart from '../components/charts/AnomalyTrendChart'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import { getDashboard, getTrends } from '../services/api'
import { fmt } from '../utils/formatters'

export default function Overview() {
  const navigate = useNavigate()
  const [dash, setDash] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getDashboard(), getTrends()])
      .then(([d, t]) => { setDash(d); setTrends(t) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Executive Overview"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Executive Overview"><ErrorBanner message={error} /></PageShell>

  const { stats, priority_list, risk_distribution } = dash

  return (
    <PageShell title="Executive Overview" subtitle="Platform-wide fraud intelligence summary">
      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <StatCard label="Total Consumers" value={fmt.number(stats.total_consumers)} />
        <StatCard label="Anomalies Detected" value={fmt.number(stats.anomalies_detected)} accent="text-amber-600" />
        <StatCard label="High-Risk Accounts" value={fmt.number(stats.high_risk_count)} accent="text-red-600" />
        <StatCard label="Critical Cases" value={fmt.number(stats.critical_count)} accent="text-purple-700" />
        <StatCard label="Revenue at Risk" value={fmt.currency(stats.revenue_at_risk)} accent="text-red-700" sub="High + Critical consumers" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Monthly Anomaly Trend</p>
          {trends && <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />}
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Risk Level Distribution</p>
          <RiskDistributionChart distribution={risk_distribution} />
        </div>
      </div>

      {/* Priority list */}
      <div className="bg-white border border-[#e2e8f0] rounded">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">Investigation Priority List</p>
          <span className="text-xs text-slate-400">Top 10 by risk score</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#f8f9fb] border-b border-[#e2e8f0]">
              {['Consumer ID','Name','Area','Risk Score','Risk Level','Primary Anomaly','Status',''].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-[#475569]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priority_list.map((row, i) => (
              <tr key={row.consumer_id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fb]'}>
                <td className="px-4 py-2 font-mono text-blue-600">{row.consumer_id}</td>
                <td className="px-4 py-2 font-medium text-[#0f172a]">{row.name}</td>
                <td className="px-4 py-2 text-[#475569]">{row.area}</td>
                <td className="px-4 py-2 font-semibold">{row.risk_score.toFixed(1)}</td>
                <td className="px-4 py-2"><RiskBadge level={row.risk_level} /></td>
                <td className="px-4 py-2 text-[#475569]">{row.primary_anomaly}</td>
                <td className="px-4 py-2"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
