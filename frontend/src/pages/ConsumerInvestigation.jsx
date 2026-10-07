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
import { AlertTriangle, CheckCircle, User, Zap, Building2, MapPin, Gauge } from 'lucide-react'

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-[13px] font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
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

  useEffect(() => { getConsumers().then(setConsumers).catch(() => {}) }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true); setError(null); setAnalysis(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const handleSelect = (id) => { setSelectedId(id); navigate(`/investigation/${id}`) }

  const c = analysis?.consumer
  const metered = c ? Math.max(c.current_reading - c.previous_reading, 0) : 0

  return (
    <PageShell title="Consumer Investigation" subtitle="Detailed fraud analysis for a single account">
      {/* Selector */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
        <User size={14} className="text-slate-400 shrink-0" />
        <label className="text-[12px] text-slate-500 shrink-0 font-medium">Consumer:</label>
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          className="flex-1 text-[13px] border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        >
          <option value="">— Select a consumer to investigate —</option>
          {consumers.map((con) => (
            <option key={con.consumer_id} value={con.consumer_id}>
              [{con.risk_level}] {con.consumer_id} — {con.name} · {con.area}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner text="Analyzing consumer records…" />}
      {error && <ErrorBanner message={error} />}

      {analysis && c && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">{c.name}</h2>
                  <RiskBadge level={analysis.risk_level} />
                  <StatusBadge status={analysis.investigation_status} />
                </div>
                <div className="flex items-center gap-4 flex-wrap text-[12px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">#</span>
                    <span className="font-mono font-bold text-blue-600">{c.consumer_id}</span>
                  </span>
                  <span className="flex items-center gap-1"><MapPin size={11} />{c.area}</span>
                  <span className="flex items-center gap-1"><Building2 size={11} />{c.connection_type}</span>
                  <span className="flex items-center gap-1"><Gauge size={11} />{c.sanctioned_load} kW sanctioned</span>
                  <span className="font-mono text-slate-400">Meter: {c.meter_number}</span>
                </div>
              </div>
              <div className="w-52 shrink-0">
                <RiskScoreBar score={analysis.risk_score} level={analysis.risk_level} />
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="bg-slate-50 rounded px-2 py-1 text-center">
                    <div className="text-slate-400">Baseline</div>
                    <div className="font-bold text-slate-700">{analysis.baseline_usage?.toFixed(0)} kWh</div>
                  </div>
                  <div className="bg-slate-50 rounded px-2 py-1 text-center">
                    <div className="text-slate-400">Current</div>
                    <div className={`font-bold ${analysis.deviation_from_baseline_pct < -30 ? 'text-red-600' : 'text-slate-700'}`}>{metered.toFixed(0)} kWh</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left col (2/3) */}
            <div className="col-span-2 space-y-4">
              {/* Consumption chart */}
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">12-Month Consumption History</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Monthly usage vs. personal baseline (red dashed line)</p>
                  </div>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                    analysis.deviation_from_baseline_pct < -50 ? 'bg-red-100 text-red-700' :
                    analysis.deviation_from_baseline_pct < -20 ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {fmt.pct(analysis.deviation_from_baseline_pct)} from baseline
                  </span>
                </div>
                <ConsumptionChart history={c.historical_monthly_usage} baseline={analysis.baseline_usage} />
                <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-50 text-[12px]">
                  <span className="text-slate-500">Peer Avg: <strong className="text-slate-700">{analysis.peer_avg_usage?.toFixed(0)} kWh</strong></span>
                  <span className="text-slate-500">Peer Dev: <strong className={analysis.deviation_from_peer_pct < -40 ? 'text-red-600' : 'text-slate-700'}>{fmt.pct(analysis.deviation_from_peer_pct)}</strong></span>
                  <span className="text-slate-500">Billing Ratio: <strong className={analysis.billing_consistency_ratio > 0.2 ? 'text-red-600' : 'text-slate-700'}>{(analysis.billing_consistency_ratio * 100).toFixed(1)}% discrepancy</strong></span>
                </div>
              </div>

              {/* Evidence signals */}
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-sm font-semibold text-slate-800 mb-4">Evidence & Contributing Signals</p>
                <div className="divide-y divide-slate-50">
                  {analysis.evidence?.map((ev, i) => (
                    <div key={i} className="py-3 flex gap-4 first:pt-0 last:pb-0">
                      <div className="w-5 shrink-0 mt-0.5">
                        {ev.weight >= 0.20 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className="text-[12px] font-semibold text-slate-700">{ev.signal}</span>
                          {ev.weight > 0 && <span className="text-[10px] text-slate-400 shrink-0 font-medium">weight {(ev.weight*100).toFixed(0)}%</span>}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mb-1 bg-slate-50 rounded px-2 py-0.5 inline-block">{ev.value}</div>
                        <div className="text-[12px] text-slate-500 leading-relaxed">{ev.interpretation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anomaly flags */}
              {analysis.anomaly_flags?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <p className="text-sm font-semibold text-slate-800 mb-3">
                    Active Anomaly Flags
                    <span className="ml-2 text-[11px] font-normal text-slate-400">({analysis.anomaly_flags.length} detected)</span>
                  </p>
                  <div className="space-y-2">
                    {analysis.anomaly_flags.map((flag, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                        flag.severity === 'critical' ? 'bg-purple-50 border-purple-100' :
                        flag.severity === 'high' ? 'bg-red-50 border-red-100' :
                        'bg-amber-50 border-amber-100'
                      }`}>
                        <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${
                          flag.severity === 'critical' ? 'text-purple-500' :
                          flag.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                        }`} />
                        <div>
                          <span className="text-[12px] font-semibold text-slate-800">
                            {flag.flag_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{flag.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right col (1/3) */}
            <div className="space-y-4">
              {/* Meter & billing */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Meter & Billing Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Previous Reading" value={fmt.number(c.previous_reading)} mono />
                  <Field label="Current Reading" value={fmt.number(c.current_reading)} mono />
                  <Field label="Metered Units" value={`${metered.toFixed(0)} kWh`} mono />
                  <Field label="Billed Units" value={`${fmt.number(c.billed_units)} kWh`} mono />
                  <Field label="Monthly Bill" value={fmt.currency(c.monthly_bill)} />
                  <Field label="Payment Status" value={c.payment_status} />
                </div>
              </div>

              {/* Score breakdown */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Score Breakdown</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Isolation Forest', val: analysis.risk_breakdown?.isolation_forest_score, w: '30%' },
                    { label: 'Baseline Deviation', val: analysis.risk_breakdown?.baseline_deviation_score, w: '25%' },
                    { label: 'Peer Deviation', val: analysis.risk_breakdown?.peer_deviation_score, w: '20%' },
                    { label: 'Billing Consistency', val: analysis.risk_breakdown?.billing_consistency_score, w: '15%' },
                    { label: 'Rule Flags', val: analysis.risk_breakdown?.rule_flag_score, w: '10%' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">{row.label} <span className="text-slate-300">({row.w})</span></span>
                        <span className="font-bold text-slate-700 tabular-nums">{(row.val||0).toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${row.val||0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Total Risk Score</span>
                  <span className={`text-base font-bold ${analysis.risk_level === 'Critical' ? 'text-purple-700' : analysis.risk_level === 'High' ? 'text-red-600' : analysis.risk_level === 'Medium' ? 'text-amber-600' : 'text-green-600'}`}>
                    {analysis.risk_score?.toFixed(1)}/100
                  </span>
                </div>
              </div>

              {/* Recommended action */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommended Action</p>
                <div className={`flex items-start gap-2.5 p-3 rounded-lg text-[12px] leading-relaxed ${
                  analysis.risk_level === 'Critical' ? 'bg-purple-50 border border-purple-100 text-purple-900' :
                  analysis.risk_level === 'High' ? 'bg-red-50 border border-red-100 text-red-900' :
                  analysis.risk_level === 'Medium' ? 'bg-amber-50 border border-amber-100 text-amber-900' :
                  'bg-green-50 border border-green-100 text-green-900'
                }`}>
                  {analysis.risk_level === 'Low'
                    ? <CheckCircle size={13} className="shrink-0 mt-0.5 text-green-600" />
                    : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                  <span>{analysis.recommended_action}</span>
                </div>
              </div>

              {/* AI Workspace link */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">AI Investigation Summary</p>
                  <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-semibold">IBM Granite</span>
                </div>
                <p className="text-[12px] text-slate-400 mb-3">Generate a natural-language investigation summary using IBM Granite AI.</p>
                <button
                  onClick={() => navigate(`/ai-workspace?consumer=${c.consumer_id}`)}
                  className="w-full py-2 text-[12px] font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={12} /> Open AI Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedId && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-20 flex flex-col items-center text-slate-300 gap-3">
          <User size={36} strokeWidth={1.2} />
          <p className="text-sm text-slate-400">Select a consumer above to view their investigation report.</p>
        </div>
      )}
    </PageShell>
  )
}
