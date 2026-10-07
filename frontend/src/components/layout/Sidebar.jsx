import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ListFilter, Users, MapPin,
  MessageSquareText, ShieldCheck, Activity, Database, Zap,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/queue', icon: ListFilter, label: 'Investigation Queue' },
  { to: '/investigation', icon: Users, label: 'Consumers' },
  { to: '/areas', icon: MapPin, label: 'Area Intelligence' },
  { to: '/ai-workspace', icon: MessageSquareText, label: 'AI Investigator' },
  { to: '/compliance', icon: ShieldCheck, label: 'Model & Compliance' },
]

export default function Sidebar() {
  return (
    <aside className="w-52 shrink-0 flex flex-col bg-slate-900 h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4 border-b border-slate-800">
        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <Zap size={13} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-white text-[13px] font-bold tracking-tight leading-none">WattWatch AI</div>
          <div className="text-slate-500 text-[10px] mt-0.5">Fraud Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded text-[12.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <Icon size={14} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800">
          <Activity size={11} className="text-green-400 shrink-0" />
          <span className="text-[11px] text-slate-400">System <span className="text-green-400 font-medium">Online</span></span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800">
          <Database size={11} className="text-blue-400 shrink-0" />
          <span className="text-[11px] text-slate-400">Dataset <span className="text-blue-400 font-medium">253 records</span></span>
        </div>
      </div>
    </aside>
  )
}
