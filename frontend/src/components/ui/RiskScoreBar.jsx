import { getRiskMeta } from '../../utils/riskUtils'

export default function RiskScoreBar({ score, level }) {
  const m = getRiskMeta(level)
  const pct = Math.min(Math.max(score || 0, 0), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Risk Score</span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color: m.color }}>{pct.toFixed(0)}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
      </div>
    </div>
  )
}
