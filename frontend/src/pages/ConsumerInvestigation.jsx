import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import PageShell from '../components/layout/PageShell'
import ScoreDisplay from '../components/ui/ScoreDisplay'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import { getConsumer, getConsumers } from '../services/api'
import { fmt } from '../utils/formatters'
import { getRiskMeta } from '../utils/riskUtils'
import {
  User, MapPin, Building2, Gauge, CheckCircle2,
  AlertTriangle, XCircle, FileSearch, Eye, RotateCcw,
} from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ---------- sub-components ----------

function InfoPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-gray-500">
      <Icon size={11} className="text-gray-400" />{label}
    </span>
  )
}

function SignalRow({ name, contribution, evidence, severity }) {
  const COLS = { critical:'#dc2626', high:'#ea580c', medium:'#d97706', low:'#16a34a' }
  const col = COLS[severity] || '#6b7280'
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="shrink-0 w-16 text-right">
        <span style={{ color: col }} className="text-[13px] font-bold tabular-nums">+{contribution}</span>
        <p className="text-[10px] text-gray-400">risk pts</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-800">{name}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{evidence}</p>
      </div>
    </div>
  )
}

function ActionBtn({ label, icon: Icon, variant, onClick }) {
  const base = 'flex items-center gap-2 px-3 py-2 rounded text-[12px] font-medium border transition-colors w-full'
  const cls = variant === 'primary'
    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
    : variant === 'danger'
      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
      : variant === 'warn'
        ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
  return (
    <button className={`${base} ${cls}`} onClick={onClick}>
      <Icon size={13} />{label}
    </button>
  )
}

// ---------- main page ----------

export default function ConsumerInvestigation() {
  const { consumerId } = useParams()
  const navigate = useNavigate()
  const [consumers, setConsumers] = useState([])
  const [selectedId, setSelectedId] = useState(consumerId || '')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  useEffect(() => { getConsumers().then(setConsumers).catch(() => {}) }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true); setError(null); setAnalysis(null); setActionMsg(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const handleSelect = id => { setSelectedId(id); navigate(`/investigation/${id}`) }

  const handleAction = (label) => {
    setActionMsg(`Action recorded: "${label}" — case updated in queue.`)
    setTimeout(() => setActionMsg(null), 4000)
  }

  const c = analysis?.consumer
  const metered = c ? Math.max(c.current_reading - c.previous_reading, 0) : 0
  const billingMatch = c ? Math.abs(metered - c.billed_units) / Math.max(metered, 1) < 0.05 : true
  const rMeta = analysis ? getRiskMeta(analysis.risk_level) : null

  // Build chart data with anomaly marker on last bar
  const chartData = c ? MONTHS.map((m, i) => ({
    month: m,
    usage: c.historical_monthly_usage[i] ?? null,
    baseline: Math.round(analysis.baseline_usage),
    peer: Math.round(analysis.peer_avg_usage),
    anomaly: i === 11 ? metered : null,
  })) : []

  // Evidence signals for "Why Flagged" section
  const signals = analysis ? [
    ...(analysis.deviation_from_baseline_pct < -40 ? [{
      name: 'Sudden Consumption Drop',
      contribution: Math.round(analysis.risk_breakdown?.baseline_deviation_score * 0.25),
      evidence: `Current usage of ${metered.toFixed(0)} kWh is ${Math.abs(analysis.deviation_from_baseline_pct).toFixed(0)}% below the ${analysis.baseline_usage.toFixed(0)} kWh historical baseline.`,
      severity: 'critical',
    }] : []),
    ...(analysis.deviation_from_peer_pct < -30 ? [{
      name: 'Peer Group Deviation',
      contribution: Math.round(analysis.risk_breakdown?.peer_deviation_score * 0.20),
      evidence: `Consumer uses ${Math.abs(analysis.deviation_from_peer_pct).toFixed(0)}% less than the peer group average of ${analysis.peer_avg_usage.toFixed(0)} kWh (${analysis.consumer?.connection_type}, ${analysis.consumer?.area}).`,
      severity: 'high',
    }] : []),
    ...(analysis.billing_consistency_ratio > 0.1 ? [{
      name: 'Billing / Meter Mismatch',
      contribution: Math.round(analysis.risk_breakdown?.billing_consistency_score * 0.15),
      evidence: `Billed units (${c?.billed_units}) differ from metered units (${metered.toFixed(0)}) by ${(analysis.billing_consistency_ratio * 100).toFixed(0)}%.`,
      severity: analysis.billing_consistency_ratio > 0.4 ? 'critical' : 'medium',
    }] : []),
    ...(analysis.risk_breakdown?.isolation_forest_score > 60 ? [{
      name: 'Statistical Outlier (ML)',
      contribution: Math.round(analysis.risk_breakdown?.isolation_forest_score * 0.30),
      evidence: `Isolation Forest anomaly score: ${(analysis.risk_breakdown.isolation_forest_score).toFixed(0)}/100 — consumption pattern is a statistical outlier among peers.`,
      severity: 'high',
    }] : []),
    ...(analysis.anomaly_flags?.filter(f => f.flag_type === 'near_zero_consumption').length > 0 ? [{
      name: 'Near-Zero Consumption',
      contribution: 15,
      evidence: `Meter reading shows near-zero units with ${c?.sanctioned_load} kW sanctioned load — requires physical inspection.`,
      severity: 'critical',
    }] : []),
  ].filter(s => s.contribution > 0).sort((a,b) => b.contribution - a.contribution) : []

  return (
    <PageShell title="Consumers" subtitle="Case investigation — individual account analysis">
      {/* Consumer selector */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 mb-4">
        <User size={13} className="text-gray-400 shrink-0" />
        <span className="text-[12px] text-gray-500 font-medium shrink-0">Consumer:</span>
        <select
          value={selectedId}
          onChange={e => handleSelect(e.target.value)}
          className="flex-1 text-[13px] border border-gray-200 rounded px-2.5 py-1 bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">— Select a consumer to investigate —</option>
          <optgroup label="Demo Cases">
            {['RJ10293','RJ10541','RJ10872'].map(id => {
              const c2 = consumers.find(c => c.consumer_id === id)
              return c2 ? (
                <option key={id} value={id}>[{c2.risk_level}] {id} — {c2.name}</option>
              ) : null
            })}
          </optgroup>
          <optgroup label="All Flagged Accounts">
            {consumers.filter(c => c.risk_level !== 'Low' && !['RJ10293','RJ10541','RJ10872'].includes(c.consumer_id))
              .map(con => (
                <option key={con.consumer_id} value={con.consumer_id}>
                  [{con.risk_level}] {con.consumer_id} — {con.name} · {con.area}
                </option>
              ))}
          </optgroup>
          <optgroup label="All Consumers">
            {consumers.filter(c => c.risk_level === 'Low' && !['RJ10872'].includes(c.consumer_id))
              .slice(0, 20).map(con => (
                <option key={con.consumer_id} value={con.consumer_id}>
                  [{con.risk_level}] {con.consumer_id} — {con.name} · {con.area}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {loading && <LoadingSpinner text="Loading case data…" />}
      {error && <ErrorBanner message={error} />}
      {actionMsg && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[12px] text-blue-700">
          <CheckCircle2 size={13} />
          {actionMsg}
        </div>
      )}

      {analysis && c && (
        <div className="space-y-4">
          {/* ===== HEADER ===== */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-2">
                  <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{c.name}</h2>
                  <RiskBadge level={analysis.risk_level} />
                  <StatusBadge status={analysis.investigation_status} />
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-1">
                  <InfoPill icon={User} label={c.consumer_id} />
                  <InfoPill icon={MapPin} label={c.area} />
                  <InfoPill icon={Building2} label={c.connection_type} />
                  <InfoPill icon={Gauge} label={`${c.sanctioned_load} kW load`} />
                  <span className="text-[11px] text-gray-400 font-mono">Meter: {c.meter_number}</span>
                </div>
              </div>
              <div className="shrink-0 min-w-[220px]">
                <ScoreDisplay score={analysis.risk_score} level={analysis.risk_level} />
                <div className="mt-3 p-2.5 bg-gray-50 border border-gray-100 rounded text-[12px]">
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">Recommended Action</p>
                  <p style={{ color: rMeta?.color }} className="font-semibold leading-snug">
                    {analysis.recommended_action?.split('.')[0]}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 2-COLUMN MAIN ===== */}
          <div className="grid grid-cols-3 gap-4">
            {/* LEFT — 2 cols */}
            <div className="col-span-2 space-y-4">

              {/* A. Consumption History */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">A. Consumption History</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">12 months — usage vs baseline vs peer average</p>
                  </div>
                  <span style={{ background: rMeta?.bg, color: rMeta?.text, border: `1px solid ${rMeta?.border}` }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded">
                    {fmt.pct(analysis.deviation_from_baseline_pct)} from baseline
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={36} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px' }}
                      formatter={(v, name) => {
                        const labels = { usage: 'Historical', baseline: 'Baseline', peer: 'Peer Avg', anomaly: '⚠ Current' }
                        return [`${v} kWh`, labels[name] || name]
                      }}
                    />
                    <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="usage" name="usage" fill="#3b82f6" opacity={0.75} radius={[2,2,0,0]} />
                    {analysis.risk_level !== 'Low' && metered > 0 && (
                      <Bar dataKey="anomaly" name="anomaly" fill={rMeta?.color} radius={[2,2,0,0]} />
                    )}
                    <Line type="monotone" dataKey="baseline" name="baseline" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                    <Line type="monotone" dataKey="peer" name="peer" stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* B. Investigation Snapshot */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[13px] font-semibold text-gray-800 mb-3">B. Investigation Snapshot</p>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Historical Average', value: `${analysis.baseline_usage?.toFixed(0)} kWh`, color: '' },
                    { label: 'Current Usage', value: `${metered.toFixed(0)} kWh`, color: analysis.deviation_from_baseline_pct < -40 ? '#dc2626' : '' },
                    { label: 'Deviation', value: fmt.pct(analysis.deviation_from_baseline_pct), color: analysis.deviation_from_baseline_pct < -30 ? '#dc2626' : '' },
                    { label: 'Peer Average', value: `${analysis.peer_avg_usage?.toFixed(0)} kWh`, color: '' },
                    { label: 'Billing Diff', value: `${Math.abs(metered - c.billed_units).toFixed(0)} kWh`, color: !billingMatch ? '#dc2626' : '#16a34a' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 border border-gray-100 rounded p-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                      <p className="text-[15px] font-bold" style={{ color: s.color || '#111827' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* C. Why This Account Was Flagged */}
              {signals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-[13px] font-semibold text-gray-800 mb-1">C. Why This Account Was Flagged</p>
                  <p className="text-[11px] text-gray-400 mb-3">Evidence signals contributing to the risk score</p>
                  <div>
                    {signals.map((s, i) => <SignalRow key={i} {...s} />)}
                  </div>
                </div>
              )}

              {/* D. Risk Score Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[13px] font-semibold text-gray-800 mb-3">D. Risk Score Breakdown</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Isolation Forest', score: analysis.risk_breakdown?.isolation_forest_score, weight: 0.30 },
                    { label: 'Baseline Deviation', score: analysis.risk_breakdown?.baseline_deviation_score, weight: 0.25 },
                    { label: 'Peer Group Deviation', score: analysis.risk_breakdown?.peer_deviation_score, weight: 0.20 },
                    { label: 'Billing Consistency', score: analysis.risk_breakdown?.billing_consistency_score, weight: 0.15 },
                    { label: 'Rule-Based Flags', score: analysis.risk_breakdown?.rule_flag_score, weight: 0.10 },
                  ].map(row => {
                    const contrib = (row.score || 0) * row.weight
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-gray-600">{row.label} <span className="text-gray-300">({(row.weight*100).toFixed(0)}%)</span></span>
                          <span className="font-semibold tabular-nums text-gray-700">+{contrib.toFixed(1)} pts</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${row.score || 0}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Total Risk Score</span>
                  <span style={{ color: rMeta?.color }} className="text-[16px] font-bold">
                    {analysis.risk_score?.toFixed(1)} / 100
                  </span>
                </div>
              </div>

              {/* E. Meter & Billing Verification */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-gray-800">E. Meter & Billing Verification</p>
                  <span style={{
                    background: billingMatch ? '#f0fdf4' : '#fef2f2',
                    color: billingMatch ? '#15803d' : '#b91c1c',
                    border: `1px solid ${billingMatch ? '#bbf7d0' : '#fecaca'}`,
                  }} className="text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    {billingMatch
                      ? <><CheckCircle2 size={11} /> Consistent</>
                      : <><XCircle size={11} /> Mismatch Detected</>}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Previous Reading', value: fmt.number(c.previous_reading), mono: true },
                    { label: 'Current Reading', value: fmt.number(c.current_reading), mono: true },
                    { label: 'Calculated Units', value: `${metered.toFixed(0)} kWh`, mono: true },
                    { label: 'Billed Units', value: `${fmt.number(c.billed_units)} kWh`, mono: true,
                      highlight: !billingMatch },
                    { label: 'Difference', value: `${Math.abs(metered - c.billed_units).toFixed(0)} kWh`,
                      highlight: !billingMatch },
                    { label: 'Monthly Bill', value: fmt.currency(c.monthly_bill) },
                  ].map(f => (
                    <div key={f.label} className="bg-gray-50 rounded p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                      <p style={f.highlight ? { color: '#dc2626' } : {}}
                        className={`text-[13px] font-semibold ${f.mono ? 'font-mono' : ''} text-gray-800`}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* F. Evidence Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[13px] font-semibold text-gray-800 mb-3">F. Evidence Timeline</p>
                <div className="relative pl-5">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                  {chartData.map((d, i) => {
                    const hist = c.historical_monthly_usage[i]
                    const base = analysis.baseline_usage
                    const dev = hist ? ((hist - base) / base) * 100 : null
                    const isAnomaly = dev !== null && Math.abs(dev) > 30
                    const isCurrent = i === 11
                    return (
                      <div key={i} className="relative flex items-start gap-3 mb-2 last:mb-0">
                        <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                          isCurrent && analysis.risk_level !== 'Low' ? 'bg-red-500' :
                          isAnomaly ? 'bg-amber-400' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 flex items-baseline justify-between">
                          <span className="text-[11px] font-medium text-gray-600">{d.month}</span>
                          <span className={`text-[11px] font-mono tabular-nums ${
                            isCurrent && analysis.risk_level !== 'Low' ? 'text-red-600 font-bold' :
                            isAnomaly ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {isCurrent && analysis.risk_level !== 'Low' ? `⚠ ${metered.toFixed(0)}` : hist?.toFixed(0) ?? '–'} kWh
                            {isCurrent && analysis.risk_level !== 'Low' ? ' (Current — anomaly)' :
                              isAnomaly ? ` (${dev?.toFixed(0)}% dev)` : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT — 1 col */}
            <div className="space-y-4">
              {/* G. AI Investigation Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-gray-700">G. AI Investigation Summary</p>
                  <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded font-semibold">IBM Granite</span>
                </div>
                <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded p-3 leading-relaxed mb-3">
                  {analysis.risk_level === 'Low'
                    ? `Consumer ${c.consumer_id} presents a low fraud risk score of ${analysis.risk_score.toFixed(0)}/100. Consumption is within expected ranges and consistent with peer group.`
                    : `Consumer ${c.consumer_id} has been assigned a ${analysis.risk_level.toLowerCase()} risk score of ${analysis.risk_score.toFixed(0)}/100. ${signals[0] ? `Primary signal: ${signals[0].name} — ${signals[0].evidence}` : ''}`
                  }
                  <p className="mt-2 text-[10px] text-gray-400 italic">Generate full AI summary in the AI Investigator page.</p>
                </div>
                <button
                  onClick={() => navigate(`/ai-workspace?consumer=${c.consumer_id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  <FileSearch size={12} /> Generate Full Explanation
                </button>
              </div>

              {/* Account details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[12px] font-semibold text-gray-700 mb-3">Account Details</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Payment Status', value: c.payment_status },
                    { label: 'Sanctioned Load', value: `${c.sanctioned_load} kW` },
                    { label: 'Peer Group', value: c.peer_group },
                    { label: 'Connection', value: c.connection_type },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{f.label}</span>
                      <span className={`text-[12px] font-medium ${
                        f.value === 'Defaulter' || f.value === 'Partial' ? 'text-red-600' : 'text-gray-700'
                      }`}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* H. Investigator Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[12px] font-semibold text-gray-700 mb-3">H. Investigator Actions</p>
                <div className="space-y-2">
                  <ActionBtn label="Monitor Account" icon={Eye} variant="default" onClick={() => handleAction('Monitor Account')} />
                  <ActionBtn label="Request Billing Review" icon={FileSearch} variant="default" onClick={() => handleAction('Request Billing Review')} />
                  <ActionBtn label="Remote Verification" icon={Gauge} variant="default" onClick={() => handleAction('Remote Verification')} />
                  <ActionBtn label="Schedule Meter Inspection" icon={AlertTriangle} variant="warn" onClick={() => handleAction('Schedule Meter Inspection')} />
                  <ActionBtn label="Mark as False Positive" icon={RotateCcw} variant="default" onClick={() => handleAction('Mark as False Positive')} />
                </div>
              </div>

              {/* Active flags */}
              {analysis.anomaly_flags?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-[12px] font-semibold text-gray-700 mb-2">Active Anomaly Flags</p>
                  <div className="space-y-1.5">
                    {analysis.anomaly_flags.map((f, i) => {
                      const SCOL = { critical: '#dc2626', high: '#ea580c', medium: '#d97706' }
                      const col = SCOL[f.severity] || '#9ca3af'
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle size={11} style={{ color: col }} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-semibold text-gray-700">
                              {f.flag_type?.replace(/_/g,' ').replace(/\b\w/g, l=>l.toUpperCase())}
                            </p>
                            <p className="text-[10px] text-gray-400">{f.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedId && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-20 flex flex-col items-center gap-3 text-gray-300">
          <User size={40} strokeWidth={1} />
          <p className="text-[13px] text-gray-400">Select a consumer above to view their investigation case.</p>
          <div className="flex gap-2 mt-2">
            {['RJ10293','RJ10541','RJ10872'].map(id => (
              <button key={id} onClick={() => handleSelect(id)}
                className="px-3 py-1.5 text-[11px] font-semibold border border-gray-200 rounded bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-600">
                Demo: {id}
              </button>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}
