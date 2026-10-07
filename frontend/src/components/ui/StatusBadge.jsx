import { STATUS_COLORS } from '../../utils/riskUtils'

export default function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Monitoring
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${c.text} ${c.bg} ${c.border}`}>
      {status}
    </span>
  )
}
