import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'

export default function TopBar({ title, subtitle }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [ts, setTs] = useState('')

  useEffect(() => {
    const now = new Date()
    setTs(now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const id = q.trim()
    if (id) { navigate(`/investigation/${id}`); setQ('') }
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-gray-400 leading-none truncate">{subtitle}</p>}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-1.5">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Consumer ID or Meter No."
            className="h-7 pl-7 pr-3 text-[12px] border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white w-52"
          />
        </div>
      </form>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0">
        <Clock size={11} />
        <span>{ts}</span>
      </div>

      {/* Investigator */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[11px] font-bold">FI</div>
        <span className="text-[12px] text-gray-600 font-medium">Investigator</span>
      </div>
    </header>
  )
}
