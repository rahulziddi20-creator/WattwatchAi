import { getRiskMeta } from '../../utils/riskUtils'

/** Large score display: "91 CRITICAL" */
export default function ScoreDisplay({ score, level }) {
  const m = getRiskMeta(level)
  const pct = Math.min(Math.max(score || 0, 0), 100)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span style={{ color: m.color }} className="text-4xl font-bold tabular-nums leading-none">{pct.toFixed(0)}</span>
        <span className="text-gray-400 text-sm">/100</span>
        <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
          className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ml-1">{level} RISK</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}
