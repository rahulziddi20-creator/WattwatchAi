import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Search, ListFilter, BarChart2,
  MapPin, BrainCircuit, Settings, Zap,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/queue', icon: ListFilter, label: 'Investigation Queue' },
  { to: '/investigation', icon: Search, label: 'Consumer Investigation' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/areas', icon: MapPin, label: 'Area Intelligence' },
  { to: '/ai-workspace', icon: BrainCircuit, label: 'AI Workspace' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-screen w-56 shrink-0 bg-[#1e2332] text-slate-300 border-r border-[#2d3348]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#2d3348]">
        <div className="flex items-center justify-center w-7 h-7 bg-blue-600 rounded">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">WattWatch AI</div>
          <div className="text-[10px] text-slate-500 leading-tight">Fraud Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors ${
                isActive
                  ? 'bg-[#252c3e] text-white border-l-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#252c3e] border-l-2 border-transparent'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2d3348] text-[10px] text-slate-600">
        v1.0.0 · IBM Granite Powered
      </div>
    </aside>
  )
}
