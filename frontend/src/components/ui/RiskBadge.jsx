import { getRiskMeta } from '../../utils/riskUtils'

/** Compact colored pill: Low / Medium / High / Critical */
export default function RiskBadge({ level }) {
  const m = getRiskMeta(level)
  return (
    <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap">
      <span style={{ background: m.dot }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {level}
    </span>
  )
}
