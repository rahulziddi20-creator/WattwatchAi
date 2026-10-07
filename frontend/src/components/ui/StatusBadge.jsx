import { STATUS_META } from '../../utils/riskUtils'

export default function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.Monitoring
  return (
    <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap">
      {status}
    </span>
  )
}
