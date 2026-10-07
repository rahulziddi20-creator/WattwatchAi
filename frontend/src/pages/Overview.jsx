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
import { Users, AlertTriangle, ShieldAlert, Flame, DollarSign, Clock } from 'lucide-react'

export default function Overview() {
  const navigate = useNavigate()
  const [dash, setDash] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([getDashboard(), getTrends()])
      .then(([d, t]) => { setDash(d); setTrends(t) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <PageShell title="Executive Overview"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Executive Overview"><ErrorBanner message={error} /></PageShell>

  const { stats, priority_list, risk_distribution } = dash

  return (
    <PageShell title="Executive Overview" subtitle="Platform-wide fraud intelligence summary" onRefresh={load}>
      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <StatCard label="Total Consumers" value={fmt.number(stats.total_consumers)} icon={Users} />
        <StatCard label="Anomalies Detected" value={fmt.number(stats.anomalies_detected)} accent="text-amber-600" icon={AlertTriangle} sub={`${((stats.anomalies_detected/stats.total_consumers)*100).toFixed(1)}% flagged`} />
        <StatCard label="High-Risk Accounts" value={fmt.number(stats.high_risk_count)} accent="text-red-600" icon={ShieldAlert} />
        <StatCard label="Critical Cases" value={fmt.number(stats.critical_count)} accent="text-purple-700" icon={Flame} />
        <StatCard label="Revenue at Risk" value={fmt.currency(stats.revenue_at_risk)} accent="text-red-700" icon={DollarSign} sub="High + Critical" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4 mb-5">
        <div className="col-span-3 bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Monthly Anomaly Trend</p>
              <p className="text-[11px] text-slate-400 mt-0.5">12-month anomaly detection history</p>
            </div>
          </div>
          {trends && <AnomalyTrendChart months={trends.months} counts={trends.anomaly_counts} />}
        </div>
        <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-800">Risk Distribution</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Consumer risk level breakdown</p>
          </div>
          <RiskDistributionChart distribution={risk_distribution} />
          {/* Legend summary */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(risk_distribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1">
                <span className="text-[11px] text-slate-500">{level}</span>
                <span className="text-[11px] font-bold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority list */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">Investigation Priority List</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Top accounts by computed risk score — requires immediate attention</p>
          </div>
          <button
            onClick={() => navigate('/queue')}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
          >
            View all →
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['#','Consumer ID','Name','Area','Risk Score','Risk Level','Primary Signal','Status',''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {priority_list.map((row, i) => (
              <tr key={row.consumer_id} className="table-row-hover">
                <td className="px-4 py-3 text-[11px] text-slate-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[12px] font-semibold text-blue-600">{row.consumer_id}</span>
                </td>
                <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{row.name}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500">{row.area}</td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-bold text-slate-800 tabular-nums">{row.risk_score.toFixed(1)}</span>
                </td>
                <td className="px-4 py-3"><RiskBadge level={row.risk_level} /></td>
                <td className="px-4 py-3 text-[12px] text-slate-500 max-w-[160px] truncate">{row.primary_anomaly}</td>
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

      {/* Recent alerts footer */}
      <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={13} className="text-slate-400" />
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Recent System Alerts</p>
        </div>
        <div className="space-y-2">
          {[
            { time: 'Just now',    level: 'Critical', msg: `Consumer ${priority_list[0]?.consumer_id} — ${priority_list[0]?.primary_anomaly} detected. Risk score: ${priority_list[0]?.risk_score?.toFixed(1)}` },
            { time: '2 min ago',   level: 'High',     msg: `${stats.high_risk_count} high-risk accounts require scheduled inspection this period` },
            { time: '5 min ago',   level: 'Medium',   msg: `${stats.anomalies_detected} anomalies detected across ${Object.keys(risk_distribution).filter(l => l !== 'Low').reduce((s, l) => s + (risk_distribution[l] || 0), 0)} accounts` },
            { time: '10 min ago',  level: 'Low',      msg: `Automated pipeline completed — ${stats.total_consumers} consumer records analyzed` },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-[10px] text-slate-400 w-16 shrink-0 mt-0.5">{a.time}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                a.level === 'Critical' ? 'bg-purple-100 text-purple-700' :
                a.level === 'High' ? 'bg-red-100 text-red-700' :
                a.level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>{a.level}</span>
              <span className="text-[12px] text-slate-600">{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
