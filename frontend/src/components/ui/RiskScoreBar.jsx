import { getRiskColor } from '../../utils/riskUtils'

export default function RiskScoreBar({ score, level, showLabel = true }) {
  const c = getRiskColor(level)
  const pct = Math.min(Math.max(score || 0, 0), 100)
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Risk Score</span>
          <span className={`text-sm font-bold tabular-nums ${c.text}`}>{pct.toFixed(0)}<span className="text-xs font-normal text-slate-400">/100</span></span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: c.bar }}
        />
      </div>
    </div>
  )
}
