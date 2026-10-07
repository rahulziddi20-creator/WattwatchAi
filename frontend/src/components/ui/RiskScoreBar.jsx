import { getRiskColor } from '../../utils/riskUtils'

export default function RiskScoreBar({ score, level }) {
  const c = getRiskColor(level)
  const pct = Math.min(Math.max(score, 0), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Risk Score</span>
        <span className={`text-sm font-bold ${c.text}`}>{pct.toFixed(0)}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: c.bar }}
        />
      </div>
    </div>
  )
}
