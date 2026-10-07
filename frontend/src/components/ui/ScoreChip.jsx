import { getRiskMeta } from '../../utils/riskUtils'

/** Inline score chip: "91 Critical" in one line, used in tables */
export default function ScoreChip({ score, level }) {
  const m = getRiskMeta(level)
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums" style={{ color: m.color }}>
      {(score || 0).toFixed(0)}
      <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
        className="px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide">{level}</span>
    </span>
  )
}
