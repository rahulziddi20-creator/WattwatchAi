import { getRiskColor } from '../../utils/riskUtils'

export default function RiskBadge({ level }) {
  const c = getRiskColor(level)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${c.text} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {level}
    </span>
  )
}
