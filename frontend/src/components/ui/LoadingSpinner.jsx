export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
