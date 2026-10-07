import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import RiskBadge from '../components/ui/RiskBadge'
import RiskScoreBar from '../components/ui/RiskScoreBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import { getConsumers, explainConsumer, getConsumer } from '../services/api'
import { BrainCircuit, AlertCircle } from 'lucide-react'

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
    getConsumers().then((list) => {
      // Show only flagged consumers
      setConsumers(list.filter((c) => c.risk_level !== 'Low'))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingAnalysis(true)
    setAnalysis(null)
    setSummary('')
    setError(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingAnalysis(false))
  }, [selectedId])

  const handleGenerate = () => {
    if (!selectedId) return
    setGenerating(true)
    setSummary('')
    setError(null)
    explainConsumer(selectedId)
      .then((data) => setSummary(data.summary))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setGenerating(false))
  }

  const c = analysis?.consumer

  return (
    <PageShell title="AI Investigation Workspace" subtitle="IBM Granite-powered fraud investigation summaries">
      <div className="grid grid-cols-3 gap-4">
        {/* Left panel — consumer selector */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded p-4">
            <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Select Flagged Consumer</p>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-sm border border-[#e2e8f0] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">— Select a consumer —</option>
              {consumers.map((con) => (
                <option key={con.consumer_id} value={con.consumer_id}>
                  [{con.risk_level}] {con.consumer_id} — {con.name}
                </option>
              ))}
            </select>
          </div>

          {loadingAnalysis && <LoadingSpinner text="Loading consumer data..." />}

          {analysis && c && (
            <div className="bg-white border border-[#e2e8f0] rounded p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#0f172a]">{c.name}</span>
                <RiskBadge level={analysis.risk_level} />
              </div>
              <p className="text-xs text-[#475569]">
                <span className="font-mono text-blue-600">{c.consumer_id}</span>
                {' · '}{c.area} · {c.connection_type}
              </p>
              <RiskScoreBar score={analysis.risk_score} level={analysis.risk_level} />
              <div className="pt-2 border-t border-[#f1f5f9] text-xs space-y-1 text-[#475569]">
                <div className="flex justify-between">
                  <span>Baseline</span><span className="font-mono">{analysis.baseline_usage?.toFixed(0)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Deviation</span>
                  <span className={`font-mono font-medium ${analysis.deviation_from_baseline_pct < -30 ? 'text-red-600' : ''}`}>
                    {analysis.deviation_from_baseline_pct > 0 ? '+' : ''}{analysis.deviation_from_baseline_pct?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flags</span><span className="font-mono">{analysis.anomaly_flags?.length || 0}</span>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-[#1e2332] text-white rounded hover:bg-[#252c3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                  : <><BrainCircuit size={14} />Generate AI Summary</>}
              </button>
            </div>
          )}
        </div>

        {/* Right panel — AI output */}
        <div className="col-span-2">
          <div className="bg-white border border-[#e2e8f0] rounded p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">AI-Generated Investigation Summary</p>
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded font-medium">IBM Granite</span>
            </div>

            {error && <ErrorBanner message={error} />}

            {!summary && !generating && !error && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-3">
                <BrainCircuit size={36} strokeWidth={1.2} />
                <p className="text-sm text-slate-400">Select a consumer and click Generate to create an AI summary.</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-sm">Generating investigation summary with IBM Granite…</p>
              </div>
            )}

            {summary && (
              <>
                <div className="bg-[#f8f9fb] border border-[#e2e8f0] rounded p-4 text-sm text-[#0f172a] leading-relaxed whitespace-pre-wrap font-sans">
                  {summary}
                </div>
                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Disclaimer:</strong> This summary is AI-generated based on computed evidence only.
                    Final determination of fraud requires human review and physical verification.
                    This system does not make definitive accusations against any consumer.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
