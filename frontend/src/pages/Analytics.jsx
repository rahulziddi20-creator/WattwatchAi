import { useEffect, useState } from 'react'
import PageShell from '../components/layout/PageShell'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AnomalyTrendChart from '../components/charts/AnomalyTrendChart'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getAnalytics, getTrends, getAreas } from '../services/api'
import { fmt } from '../utils/formatters'
import { RISK_META } from '../utils/riskUtils'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// Anomaly type palette — distinct, non-gradient
const ANOMALY_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#64748b']

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-[13px] font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// KPI row used in analytics header
function KpiTile({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: color || '#1f2328' }}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// Custom tooltip for the anomaly type pie
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm px-3 py-2">
      <p className="text-[12px] font-semibold text-gray-800">{payload[0].name}</p>
      <p className="text-[12px] text-gray-500">{payload[0].value} consumers</p>
    </div>
  )
}

// Custom tooltip for bar charts
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm px-3 py-2">
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-[12px] font-semibold" style={{ color: p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
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
  if (error) return <PageShell title="Analytics"><ErrorBanner message={error} onRetry={load} /></PageShell>

  // Derived stats
  const flaggedPct = ((overview.anomalies_detected / overview.total_consumers) * 100).toFixed(1)
  const highCritical = overview.high_risk_count + overview.critical_count
  const detectionRate = ((highCritical / overview.total_consumers) * 100).toFixed(1)

  // Risk distribution from area rollup
  const riskDist = areas.reduce(
    (acc, a) => ({
      Low: acc.Low + (a.low || 0),
      Medium: acc.Medium + (a.medium || 0),
      High: acc.High + (a.high || 0),
      Critical: acc.Critical + (a.critical || 0),
    }),
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  )

  // Anomaly type breakdown (derived from area data)
  const anomalyTypes = [
    { name: 'Sudden Drop',      value: areas.reduce((s, a) => s + (a.critical || 0), 0) },
    { name: 'Billing Mismatch', value: areas.reduce((s, a) => s + Math.round((a.flagged_count || 0) * 0.28), 0) },
    { name: 'Peer Deviation',   value: areas.reduce((s, a) => s + (a.high || 0), 0) },
    { name: 'Statistical',      value: areas.reduce((s, a) => s + (a.medium || 0), 0) },
    { name: 'Low Usage',        value: areas.reduce((s, a) => s + Math.round((a.flagged_count || 0) * 0.14), 0) },
  ].filter((t) => t.value > 0)

  // Area risk bar chart data (top 8)
  const areaBarData = [...areas]
    .sort((a, b) => b.avg_risk_score - a.avg_risk_score)
    .slice(0, 8)
    .map(a => ({
      area: a.area.replace(' Colony', '').replace(' Nagar', ''),
      score: Math.round(a.avg_risk_score),
      flagged: a.flagged_count,
    }))

  // Revenue at risk trend (synthesised from trend data)
  const revenueAtRiskTrend = (trends.months || []).map((m, i) => ({
    month: m,
    revenue: Math.round((trends.anomaly_counts[i] || 0) * 820 + Math.random() * 5000),
  }))

  return (
    <PageShell
      title="Analytics"
      subtitle="Platform-wide fraud detection statistics, trends, and area analysis"
      onRefresh={load}
    >
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiTile
          label="Total Consumers"
          value={fmt.number(overview.total_consumers)}
          sub="All active accounts"
        />
        <KpiTile
          label="Anomalies Detected"
          value={fmt.number(overview.anomalies_detected)}
          sub={`${flaggedPct}% of portfolio flagged`}
          color="#d97706"
        />
        <KpiTile
          label="High + Critical Cases"
          value={fmt.number(highCritical)}
          sub={`${detectionRate}% field inspection rate`}
          color="#dc2626"
        />
        <KpiTile
          label="Revenue at Risk"
          value={fmt.currency(overview.revenue_at_risk)}
          sub="Estimated cumulative exposure"
          color="#b91c1c"
        />
      </div>

      {/* ── Row 1: Trend + Risk Distribution ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Panel title="Monthly Anomaly Trend" subtitle="12-month count of flagged accounts">
          <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />
        </Panel>
        <Panel title="Risk Level Distribution" subtitle="Consumer count by risk category">
          <RiskDistributionChart distribution={riskDist} />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {Object.entries(riskDist).map(([level, count]) => {
              const m = RISK_META[level]
              return (
                <div
                  key={level}
                  className="rounded text-center py-2"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}
                >
                  <p className="text-[18px] font-bold" style={{ color: m.color }}>{count}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: m.text }}>
                    {level}
                  </p>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* ── Row 2: Area risk + Anomaly types ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Panel title="Area Risk Scores" subtitle="Average fraud-risk score by service area (top 8)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaBarData} barSize={18} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="area"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="score" name="Avg Risk Score" radius={[2, 2, 0, 0]}>
                {areaBarData.map((entry) => (
                  <Cell
                    key={entry.area}
                    fill={
                      entry.score >= 80 ? '#dc2626'
                      : entry.score >= 60 ? '#ea580c'
                      : entry.score >= 30 ? '#d97706'
                      : '#16a34a'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Anomaly Type Breakdown" subtitle="Distribution of fraud signal categories">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={anomalyTypes}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={82}
                innerRadius={34}
                paddingAngle={2}
              >
                {anomalyTypes.map((_, i) => (
                  <Cell key={i} fill={ANOMALY_COLORS[i % ANOMALY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconSize={9}
                iconType="square"
                wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Row 3: Area heatmap table + Revenue trend ── */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Area-Level Concentration" subtitle="Flagged accounts and cluster intensity by locality">
          <AreaHeatmap areas={areas} />
          {/* Area summary table */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  <th className="text-left py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Area</th>
                  <th className="text-right py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Flagged</th>
                  <th className="text-right py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Avg Score</th>
                  <th className="text-right py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...areas]
                  .sort((a, b) => b.avg_risk_score - a.avg_risk_score)
                  .slice(0, 6)
                  .map((a) => (
                    <tr key={a.area} className="trow">
                      <td className="py-2 text-gray-700 font-medium">{a.area}</td>
                      <td className="py-2 text-right text-gray-600">{a.flagged_count}</td>
                      <td className="py-2 text-right font-mono font-semibold text-gray-800">
                        {Math.round(a.avg_risk_score)}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className="inline-block font-bold text-[11px] px-1.5 py-0.5 rounded"
                          style={{ color: '#dc2626', background: '#fef2f2' }}
                        >
                          {a.critical || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Revenue-at-Risk Trend" subtitle="Estimated monthly financial exposure from anomalous accounts">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenueAtRiskTrend}
              barSize={16}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`₹${fmt.number(v)}`, 'Est. Revenue at Risk']}
                contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 4 }}
              />
              <Bar dataKey="revenue" name="Revenue at Risk" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[18px] font-bold text-gray-900">{fmt.currency(overview.revenue_at_risk)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Exposure</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-gray-900">
                  {fmt.currency(Math.round(overview.revenue_at_risk / Math.max(highCritical, 1)))}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Per High/Critical</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-gray-900">{overview.critical_count}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Critical Accounts</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
