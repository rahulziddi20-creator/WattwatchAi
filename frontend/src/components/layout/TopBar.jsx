import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function TopBar({ title, subtitle, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    if (!onRefresh) return
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
    onRefresh()
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0">
      <div className="flex flex-col justify-center">
        <h1 className="text-[15px] font-semibold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-slate-400 leading-tight mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
        <button className="relative p-2 rounded-md hover:bg-slate-100 transition-colors">
          <Bell size={15} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            OP
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">Operator</div>
            <div className="text-[10px] text-slate-400">Fraud Investigator</div>
          </div>
        </div>
      </div>
    </header>
  )
}
