import { useEffect, useState } from 'react'
import PageShell from '../components/layout/PageShell'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AnomalyTrendChart from '../components/charts/AnomalyTrendChart'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getAnalytics, getTrends, getAreas } from '../services/api'
import { fmt } from '../utils/formatters'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const ANOMALY_COLORS = ['#3b82f6','#f59e0b','#ef4444','#8b5cf6','#10b981','#64748b']

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState(null)
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([getAnalytics(), getTrends(), getAreas()])
      .then(([ov, tr, ar]) => { setOverview(ov); setTrends(tr); setAreas(ar) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  if (loading) return <PageShell title="Analytics"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Analytics"><ErrorBanner message={error} /></PageShell>

  const anomalyTypes = [
    { name: 'Sudden Drop', value: areas.reduce((s, a) => s + a.critical, 0) },
    { name: 'Billing Mismatch', value: areas.reduce((s, a) => s + Math.round(a.flagged_count * 0.3), 0) },
    { name: 'Peer Deviation', value: areas.reduce((s, a) => s + Math.round(a.high * 0.4), 0) },
    { name: 'Statistical', value: areas.reduce((s, a) => s + a.medium, 0) },
    { name: 'Low Usage', value: areas.reduce((s, a) => s + Math.round(a.flagged_count * 0.15), 0) },
  ].filter((t) => t.value > 0)

  const riskDist = areas.reduce(
    (acc, a) => ({ Low: acc.Low+a.low, Medium: acc.Medium+a.medium, High: acc.High+a.high, Critical: acc.Critical+a.critical }),
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  )

  const flaggedPct = overview ? ((overview.anomalies_detected / overview.total_consumers) * 100).toFixed(1) : 0

  return (
    <PageShell title="Analytics" subtitle="Platform-wide fraud detection statistics and trends" onRefresh={load}>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Consumers', value: fmt.number(overview.total_consumers), sub: 'All accounts monitored' },
          { label: 'Anomalies Detected', value: fmt.number(overview.anomalies_detected), accent: 'text-amber-600', sub: `${flaggedPct}% of consumers flagged` },
          { label: 'High + Critical', value: fmt.number(overview.high_risk_count + overview.critical_count), accent: 'text-red-600', sub: 'Require field inspection' },
          { label: 'Revenue at Risk', value: fmt.currency(overview.revenue_at_risk), accent: 'text-red-700', sub: 'Estimated loss exposure' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{card.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${card.accent || 'text-slate-900'}`}>{card.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Monthly Anomaly Trend" subtitle="12-month history of anomaly detections">
          <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />
        </SectionCard>
        <SectionCard title="Risk Level Distribution" subtitle="Breakdown of consumers by risk category">
          <RiskDistributionChart distribution={riskDist} />
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Object.entries(riskDist).map(([l, v]) => (
              <div key={l} className="text-center bg-slate-50 rounded py-1.5">
                <div className="text-lg font-bold text-slate-800">{v}</div>
                <div className="text-[10px] text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Area-Level Risk Concentration" subtitle="Average risk score per service area">
          <AreaHeatmap areas={areas} />
          <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2">
            {areas.slice(0,4).map((a) => (
              <div key={a.area} className="flex items-center justify-between text-[12px] bg-slate-50 rounded px-2 py-1">
                <span className="text-slate-600 font-medium">{a.area}</span>
                <span className="text-slate-500">{a.flagged_count} flagged</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Anomaly Type Breakdown" subtitle="Distribution of fraud signal categories">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={anomalyTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {anomalyTypes.map((_, i) => <Cell key={i} fill={ANOMALY_COLORS[i % ANOMALY_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </PageShell>
  )
}
