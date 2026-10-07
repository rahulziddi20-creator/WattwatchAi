import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
      <AlertCircle size={15} className="shrink-0" />
      {message || 'An error occurred. Please try again.'}
    </div>
  )
}
