import { STATUS_STYLES } from '../../utils/riskUtils'

export default function StatusBadge({ status }) {
  const c = STATUS_STYLES[status] || STATUS_STYLES.Monitoring
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${c.text} ${c.bg} ${c.border}`}>
      {status}
    </span>
  )
}
