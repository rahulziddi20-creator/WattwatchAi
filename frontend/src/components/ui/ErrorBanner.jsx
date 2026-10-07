import { AlertCircle } from 'lucide-react'
export default function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">
      <AlertCircle size={14} className="shrink-0" />
      {message || 'An error occurred. Please try again.'}
    </div>
  )
}
