import { Inbox } from 'lucide-react'
export default function EmptyState({ title = 'No data', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
      <Inbox size={26} strokeWidth={1.5} />
      <p className="text-[12px] font-medium text-gray-500">{title}</p>
      {description && <p className="text-[11px] text-gray-400">{description}</p>}
    </div>
  )
}
