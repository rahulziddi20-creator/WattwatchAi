import { getRiskColor } from '../../utils/riskUtils'

export default function RiskBadge({ level }) {
  const c = getRiskColor(level)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${c.text} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level}
    </span>
  )
}
