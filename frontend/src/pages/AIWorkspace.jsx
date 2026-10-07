import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import RiskBadge from '../components/ui/RiskBadge'
import RiskScoreBar from '../components/ui/RiskScoreBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import { getConsumers, explainConsumer, getConsumer } from '../services/api'
import { BrainCircuit, AlertCircle, Sparkles } from 'lucide-react'

export default function AIWorkspace() {
  const [params] = useSearchParams()
  const [consumers, setConsumers] = useState([])
  const [selectedId, setSelectedId] = useState(params.get('consumer') || '')
  const [analysis, setAnalysis] = useState(null)
  const [summary, setSummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getConsumers()
      .then((list) => setConsumers(list.filter((c) => c.risk_level !== 'Low')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingAnalysis(true); setAnalysis(null); setSummary(''); setError(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingAnalysis(false))
  }, [selectedId])

  const handleGenerate = () => {
    if (!selectedId) return
    setGenerating(true); setSummary(''); setError(null)
    explainConsumer(selectedId)
      .then((data) => setSummary(data.summary))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setGenerating(false))
  }

  const c = analysis?.consumer

  return (
    <PageShell title="AI Investigation Workspace" subtitle="IBM Granite-powered natural language investigation summaries">
      <div className="grid grid-cols-3 gap-4">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit size={14} className="text-purple-500" />
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Select Flagged Consumer</p>
            </div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-[13px] border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            >
              <option value="">— Select consumer —</option>
              {consumers.map((con) => (
                <option key={con.consumer_id} value={con.consumer_id}>
                  [{con.risk_level}] {con.consumer_id} — {con.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-2">{consumers.length} flagged accounts available</p>
          </div>

          {loadingAnalysis && <LoadingSpinner text="Loading consumer data…" />}

          {/* Consumer snapshot */}
          {analysis && c && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{c.name}</p>
                  <p className="font-mono text-[11px] text-blue-600 mt-0.5">{c.consumer_id}</p>
                </div>
                <RiskBadge level={analysis.risk_level} />
              </div>
              <p className="text-[11px] text-slate-400">{c.area} · {c.connection_type}</p>
              <RiskScoreBar score={analysis.risk_score} level={analysis.risk_level} />

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: 'Baseline', value: `${analysis.baseline_usage?.toFixed(0)} kWh` },
                  { label: 'Current', value: `${Math.max(c.current_reading - c.previous_reading, 0).toFixed(0)} kWh` },
                  { label: 'Deviation', value: `${analysis.deviation_from_baseline_pct > 0 ? '+' : ''}${analysis.deviation_from_baseline_pct?.toFixed(1)}%` },
                  { label: 'Flags', value: `${analysis.anomaly_flags?.length || 0} signals` },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded px-2 py-1.5">
                    <div className="text-[10px] text-slate-400">{s.label}</div>
                    <div className="text-[12px] font-bold text-slate-700">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Flags list */}
              {analysis.anomaly_flags?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Active Flags</p>
                  <div className="space-y-1">
                    {analysis.anomaly_flags.slice(0, 3).map((f, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {f.flag_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                ) : (
                  <><Sparkles size={13} />Generate AI Summary</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right panel — AI output */}
        <div className="col-span-2">
          <div className="bg-white border border-slate-200 rounded-lg h-full min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BrainCircuit size={15} className="text-purple-500" />
                <p className="text-sm font-semibold text-slate-800">AI-Generated Investigation Summary</p>
              </div>
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-semibold">IBM Granite</span>
            </div>

            <div className="flex-1 p-5 flex flex-col">
              {error && <ErrorBanner message={error} />}

              {!summary && !generating && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <BrainCircuit size={44} strokeWidth={1} />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-400">No summary generated yet</p>
                    <p className="text-[12px] text-slate-300 mt-1">Select a flagged consumer and click <strong>Generate AI Summary</strong></p>
                  </div>
                </div>
              )}

              {generating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Generating investigation summary…</p>
                    <p className="text-[12px] text-slate-300 mt-1">IBM Granite is analyzing the fraud evidence</p>
                  </div>
                </div>
              )}

              {summary && (
                <div className="flex flex-col gap-4">
                  {/* Summary box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg text-[12px] text-amber-800">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <strong className="font-semibold">Responsible AI Disclaimer:</strong> This summary is AI-generated based on computed statistical evidence only.
                      It does not constitute proof of fraud. Final determination requires human review and physical verification.
                      This system does not make definitive accusations against any consumer.
                    </div>
                  </div>

                  {/* Re-generate */}
                  <button
                    onClick={handleGenerate}
                    className="self-start flex items-center gap-2 px-4 py-2 text-[12px] font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles size={12} /> Regenerate Summary
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
