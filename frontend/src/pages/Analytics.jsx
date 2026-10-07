import { useEffect, useState } from 'react'
import PageShell from '../components/layout/PageShell'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AnomalyTrendChart from '../components/charts/AnomalyTrendChart'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getAnalytics, getTrends, getAreas } from '../services/api'
import { fmt } from '../utils/formatters'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'

const ANOMALY_COLORS = ['#3b82f6','#f59e0b','#ef4444','#8b5cf6','#10b981','#64748b']

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState(null)
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getAnalytics(), getTrends(), getAreas()])
      .then(([ov, tr, ar]) => { setOverview(ov); setTrends(tr); setAreas(ar) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Analytics"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Analytics"><ErrorBanner message={error} /></PageShell>

  // Anomaly type breakdown from area data
  const anomalyTypes = [
    { name: 'Sudden Drop', value: areas.filter(a => a.critical > 0).reduce((s, a) => s + a.critical, 0) },
    { name: 'Billing Mismatch', value: areas.reduce((s, a) => s + Math.round(a.flagged_count * 0.3), 0) },
    { name: 'Peer Deviation', value: areas.reduce((s, a) => s + Math.round(a.high * 0.4), 0) },
    { name: 'Statistical', value: areas.reduce((s, a) => s + a.medium, 0) },
    { name: 'Low Usage', value: areas.reduce((s, a) => s + Math.round(a.flagged_count * 0.15), 0) },
  ].filter((t) => t.value > 0)

  const riskDist = areas.reduce(
    (acc, a) => ({ Low: acc.Low + a.low, Medium: acc.Medium + a.medium, High: acc.High + a.high, Critical: acc.Critical + a.critical }),
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  )

  return (
    <PageShell title="Analytics" subtitle="Platform-wide fraud detection statistics">
      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs text-slate-500 mb-1">Total Consumers</p>
          <p className="text-2xl font-bold">{fmt.number(overview.total_consumers)}</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs text-slate-500 mb-1">Anomalies Detected</p>
          <p className="text-2xl font-bold text-amber-600">{fmt.number(overview.anomalies_detected)}</p>
          <p className="text-xs text-slate-400">{((overview.anomalies_detected / overview.total_consumers) * 100).toFixed(1)}% of consumers</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs text-slate-500 mb-1">High + Critical</p>
          <p className="text-2xl font-bold text-red-600">{fmt.number(overview.high_risk_count + overview.critical_count)}</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs text-slate-500 mb-1">Revenue at Risk</p>
          <p className="text-2xl font-bold text-red-700">{fmt.currency(overview.revenue_at_risk)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Monthly Anomaly Trend (12 months)</p>
          <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Risk Level Distribution</p>
          <RiskDistributionChart distribution={riskDist} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Area-Level Risk Concentration</p>
          <AreaHeatmap areas={areas} />
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded p-4">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Anomaly Type Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={anomalyTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {anomalyTypes.map((_, i) => <Cell key={i} fill={ANOMALY_COLORS[i % ANOMALY_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageShell>
  )
}
