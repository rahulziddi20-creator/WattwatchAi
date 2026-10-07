import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
      <Inbox size={28} strokeWidth={1.5} />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  )
}
