import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import ScoreDisplay from '../components/ui/ScoreDisplay'
import RiskBadge from '../components/ui/RiskBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import { getConsumers, explainConsumer, getConsumer } from '../services/api'
import { MessageSquareText, Sparkles, AlertCircle, ChevronRight } from 'lucide-react'

const SUGGESTED = [
  'Why was this consumer flagged?',
  'What changed compared with previous months?',
  'How does this account compare with peers?',
  'What should an investigator verify first?',
  'What evidence contributed most to the risk score?',
]

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
      .then(list => setConsumers(list.filter(c => c.risk_level !== 'Low')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingAnalysis(true); setAnalysis(null); setSummary(''); setError(null)
    getConsumer(selectedId)
      .then(setAnalysis)
      .catch(e => setError(e.message))
      .finally(() => setLoadingAnalysis(false))
  }, [selectedId])

  const handleGenerate = () => {
    if (!selectedId) return
    setGenerating(true); setSummary(''); setError(null)
    explainConsumer(selectedId)
      .then(data => setSummary(data.summary))
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setGenerating(false))
  }

  const c = analysis?.consumer

  return (
    <PageShell title="AI Investigator" subtitle="Evidence-aware investigation summaries powered by IBM Granite">
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT panel */}
        <div className="space-y-3">
          {/* Consumer selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquareText size={13} className="text-violet-500" />
              <p className="text-[12px] font-semibold text-gray-700">Select Flagged Consumer</p>
            </div>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full text-[13px] border border-gray-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
              <option value="">— Choose consumer —</option>
              <optgroup label="Demo Cases">
                {['RJ10293','RJ10541'].map(id => {
                  const f = consumers.find(c => c.consumer_id === id)
                  return f ? <option key={id} value={id}>[{f.risk_level}] {id} — {f.name}</option> : null
                })}
              </optgroup>
              <optgroup label="All Flagged">
                {consumers.filter(c => !['RJ10293','RJ10541'].includes(c.consumer_id)).map(con => (
                  <option key={con.consumer_id} value={con.consumer_id}>
                    [{con.risk_level}] {con.consumer_id} — {con.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="text-[10px] text-gray-400 mt-1.5">{consumers.length} flagged accounts available</p>
          </div>

          {loadingAnalysis && <LoadingSpinner text="Loading account data…" />}

          {/* Consumer snapshot */}
          {analysis && c && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-gray-800">{c.name}</p>
                  <p className="font-mono text-[11px] text-blue-600">{c.consumer_id}</p>
                  <p className="text-[11px] text-gray-400">{c.area} · {c.connection_type}</p>
                </div>
                <RiskBadge level={analysis.risk_level} />
              </div>
              <ScoreDisplay score={analysis.risk_score} level={analysis.risk_level} />
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  ['Baseline', `${analysis.baseline_usage?.toFixed(0)} kWh`],
                  ['Current', `${Math.max(c.current_reading-c.previous_reading,0).toFixed(0)} kWh`],
                  ['Deviation', `${(analysis.deviation_from_baseline_pct>0?'+':'')}${analysis.deviation_from_baseline_pct?.toFixed(1)}%`],
                  ['Active Flags', `${analysis.anomaly_flags?.length||0}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded p-2">
                    <div className="text-gray-400">{l}</div>
                    <div className="font-bold text-gray-800">{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {generating
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                  : <><Sparkles size={12} />Generate Explanation</>}
              </button>
            </div>
          )}

          {/* Suggested questions */}
          {analysis && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested Questions</p>
              <div className="space-y-1">
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={handleGenerate}
                    className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700">
                    <ChevronRight size={10} className="text-gray-400 shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT panel — output */}
        <div className="col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg h-full min-h-[560px] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquareText size={14} className="text-violet-500" />
                <p className="text-[13px] font-semibold text-gray-800">Investigation Summary</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded font-semibold">IBM Granite</span>
                <span className="text-[10px] text-gray-400">Local Fallback if API unavailable</span>
              </div>
            </div>

            <div className="flex-1 p-5 flex flex-col">
              {error && <ErrorBanner message={error} />}

              {!summary && !generating && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
                  <MessageSquareText size={44} strokeWidth={0.75} />
                  <div className="text-center max-w-xs">
                    <p className="text-[13px] font-medium text-gray-400 mb-1">No summary generated</p>
                    <p className="text-[12px] text-gray-300">Select a flagged consumer and click Generate Explanation, or choose a suggested question.</p>
                  </div>
                </div>
              )}

              {generating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-[13px] font-medium text-gray-500">Generating investigation summary…</p>
                  <p className="text-[11px] text-gray-400">IBM Granite is analyzing the computed fraud evidence</p>
                </div>
              )}

              {summary && (
                <div className="flex flex-col gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                      <strong>Responsible AI:</strong> This summary is generated from computed statistical evidence only.
                      It does not constitute proof of fraud. WattWatch AI identifies suspicious anomalies for human review —
                      it does not determine guilt or confirm electricity theft. All flagged accounts require human investigation before action.
                    </p>
                  </div>
                  <button onClick={handleGenerate}
                    className="self-start flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium border border-gray-200 text-gray-600 rounded hover:bg-gray-50">
                    <Sparkles size={11} /> Regenerate
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
