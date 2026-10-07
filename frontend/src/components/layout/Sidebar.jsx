import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Search, ListFilter, BarChart2,
  MapPin, BrainCircuit, Settings, Zap, ChevronRight,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/queue', icon: ListFilter, label: 'Investigation Queue' },
  { to: '/investigation', icon: Search, label: 'Consumer Detail' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/areas', icon: MapPin, label: 'Area Intelligence' },
  { to: '/ai-workspace', icon: BrainCircuit, label: 'AI Workspace' },
  { to: '/settings', icon: Settings, label: 'Model & Settings' },
]

export default function Sidebar() {
  return (
    <aside style={{ width: 220 }} className="flex flex-col h-screen shrink-0 bg-slate-900 border-r border-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-white font-bold text-sm tracking-tight leading-none mb-0.5">WattWatch AI</div>
          <div className="text-slate-500 text-[10px] tracking-wide uppercase">Fraud Intelligence</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-1">
        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Navigation</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium mb-0.5 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">OP</div>
          <div>
            <div className="text-white text-xs font-medium">Operator</div>
            <div className="text-slate-600 text-[10px]">v1.0.0 · IBM Granite</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
