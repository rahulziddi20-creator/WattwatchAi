import { Bell, Circle } from 'lucide-react'

export default function TopBar({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between h-12 px-6 bg-white border-b border-[#e2e8f0] shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-[#0f172a] leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#475569]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded hover:bg-slate-100 transition-colors">
          <Bell size={15} className="text-slate-500" />
          <Circle size={6} className="absolute top-1 right-1 fill-red-500 text-red-500" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
            OP
          </div>
          <span className="text-xs text-slate-600 font-medium">Operator</span>
        </div>
      </div>
    </header>
  )
}
