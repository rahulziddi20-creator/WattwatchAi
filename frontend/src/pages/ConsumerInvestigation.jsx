import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import RiskBadge from '../components/ui/RiskBadge'
import RiskScoreBar from '../components/ui/RiskScoreBar'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import ConsumptionChart from '../components/charts/ConsumptionChart'
import { getConsumer, getConsumers } from '../services/api'
import { fmt } from '../utils/formatters'
import { AlertTriangle, CheckCircle, User, Zap } from 'lucide-react'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#94a3b8]">{label}</p>
      <p className="text-sm font-medium text-[#0f172a]">{value ?? '—'}</p>
    </div>
  )
}

export default function ConsumerInvestigation() {
  const { consumerId } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [consumers, setConsumers] = useState([])
  const [selectedId, setSelectedId] = useState(consumerId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load consumer list for selector
  useEffect(() => {
    getConsumers().then(setConsumers).catch(() => {})
  }, [])

  // Load analysis when consumerId changes
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const handleSelect = (id) => {
    setSelectedId(id)
    navigate(`/investigation/${id}`)
  }

  const c = analysis?.consumer
  const metered = c ? (c.current_reading - c.previous_reading) : 0

  return (
    <PageShell title="Consumer Investigation" subtitle="Detailed fraud analysis for a single account">
      {/* Consumer selector */}
      <div className="bg-white border border-[#e2e8f0] rounded p-3 mb-4 flex items-center gap-3">
        <User size={14} className="text-slate-400 shrink-0" />
        <label className="text-xs text-slate-500 shrink-0">Select Consumer:</label>
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          className="flex-1 text-sm border border-[#e2e8f0] rounded px-2 py-1 bg-white text-[#0f172a] focus:outline-none focus:border-blue-400"
        >
          <option value="">— Select a consumer —</option>
          {consumers.map((con) => (
            <option key={con.consumer_id} value={con.consumer_id}>
              {con.consumer_id} — {con.name} ({con.area}) [{con.risk_level}]
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner text="Loading consumer analysis..." />}
      {error && <ErrorBanner message={error} />}

      {analysis && c && (
        <>
          {/* Header */}
          <div className="bg-white border border-[#e2e8f0] rounded p-4 mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-[#0f172a]">{c.name}</h2>
                <RiskBadge level={analysis.risk_level} />
                <StatusBadge status={analysis.investigation_status} />
              </div>
              <p className="text-xs text-[#475569]">
                ID: <span className="font-mono text-blue-600">{c.consumer_id}</span>
                {' · '}Area: {c.area}
                {' · '}{c.connection_type}
                {' · '}Meter: <span className="font-mono">{c.meter_number}</span>
              </p>
            </div>
            <div className="w-48">
              <RiskScoreBar score={analysis.risk_score} level={analysis.risk_level} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Left 2/3 */}
            <div className="col-span-2 space-y-4">
              {/* Consumption chart */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">
                  12-Month Consumption vs Baseline
                </p>
                <ConsumptionChart
                  history={c.historical_monthly_usage}
                  baseline={analysis.baseline_usage}
                />
                <div className="flex gap-4 mt-3 text-xs text-[#475569]">
                  <span>Avg Baseline: <strong>{analysis.baseline_usage?.toFixed(0)} kWh</strong></span>
                  <span>Current: <strong>{metered?.toFixed(0)} kWh</strong></span>
                  <span>Deviation: <strong className={analysis.deviation_from_baseline_pct < -30 ? 'text-red-600' : ''}>
                    {fmt.pct(analysis.deviation_from_baseline_pct)}
                  </strong></span>
                  <span>Peer Avg: <strong>{analysis.peer_avg_usage?.toFixed(0)} kWh</strong></span>
                </div>
              </div>

              {/* Evidence */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Evidence & Contributing Signals</p>
                <div className="space-y-3">
                  {analysis.evidence?.map((ev, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="shrink-0 w-32 font-medium text-[#475569]">{ev.signal}</div>
                      <div className="flex-1">
                        <div className="font-mono text-[#0f172a] mb-0.5">{ev.value}</div>
                        <div className="text-[#94a3b8]">{ev.interpretation}</div>
                      </div>
                      {ev.weight > 0 && (
                        <div className="shrink-0 text-[#94a3b8]">×{(ev.weight * 100).toFixed(0)}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Anomaly flags */}
              {analysis.anomaly_flags?.length > 0 && (
                <div className="bg-white border border-[#e2e8f0] rounded p-4">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Anomaly Flags</p>
                  <div className="space-y-2">
                    {analysis.anomaly_flags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-[#0f172a]">{flag.flag_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span className="text-[#94a3b8] ml-2">— {flag.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1/3 */}
            <div className="space-y-4">
              {/* Meter/billing */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Meter & Billing</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Previous Reading" value={fmt.number(c.previous_reading)} />
                  <Field label="Current Reading" value={fmt.number(c.current_reading)} />
                  <Field label="Metered Units" value={`${metered.toFixed(0)} kWh`} />
                  <Field label="Billed Units" value={`${fmt.number(c.billed_units)} kWh`} />
                  <Field label="Monthly Bill" value={fmt.currency(c.monthly_bill)} />
                  <Field label="Payment Status" value={c.payment_status} />
                  <Field label="Sanctioned Load" value={`${c.sanctioned_load} kW`} />
                  <Field label="Billing Ratio" value={`${(analysis.billing_consistency_ratio * 100).toFixed(1)}% discrepancy`} />
                </div>
              </div>

              {/* Risk breakdown */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Score Breakdown</p>
                {[
                  { label: 'Isolation Forest', val: analysis.risk_breakdown?.isolation_forest_score, w: '30%' },
                  { label: 'Baseline Deviation', val: analysis.risk_breakdown?.baseline_deviation_score, w: '25%' },
                  { label: 'Peer Deviation', val: analysis.risk_breakdown?.peer_deviation_score, w: '20%' },
                  { label: 'Billing Consistency', val: analysis.risk_breakdown?.billing_consistency_score, w: '15%' },
                  { label: 'Rule Flags', val: analysis.risk_breakdown?.rule_flag_score, w: '10%' },
                ].map((row) => (
                  <div key={row.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-[#475569]">{row.label} <span className="text-[#94a3b8]">({row.w})</span></span>
                      <span className="font-medium">{(row.val || 0).toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.val || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Recommended Action</p>
                <div className={`flex items-start gap-2 p-2 rounded text-xs ${
                  analysis.risk_level === 'Critical' || analysis.risk_level === 'High'
                    ? 'bg-red-50 border border-red-100 text-red-800'
                    : 'bg-blue-50 border border-blue-100 text-blue-800'
                }`}>
                  {analysis.risk_level === 'Low'
                    ? <CheckCircle size={13} className="shrink-0 mt-0.5 text-green-600" />
                    : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                  <span>{analysis.recommended_action}</span>
                </div>
              </div>

              {/* AI Summary placeholder — links to AI Workspace */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">AI Investigation Summary</p>
                  <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">IBM Granite</span>
                </div>
                <p className="text-xs text-[#94a3b8] mb-3">
                  Generate an AI-powered investigation summary using IBM Granite.
                </p>
                <button
                  onClick={() => navigate(`/ai-workspace?consumer=${c.consumer_id}`)}
                  className="w-full py-1.5 text-xs bg-[#1e2332] text-white rounded hover:bg-[#252c3e] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap size={12} /> Open in AI Workspace
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedId && !loading && (
        <div className="bg-white border border-[#e2e8f0] rounded p-16 text-center text-slate-400">
          <User size={32} strokeWidth={1.5} className="mx-auto mb-3" />
          <p className="text-sm">Select a consumer above to view their investigation report.</p>
        </div>
      )}
    </PageShell>
  )
}
