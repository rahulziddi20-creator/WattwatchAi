export default function StatCard({ label, value, sub, accent, icon: Icon, trend }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Icon size={14} className="text-slate-400" />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight leading-none mt-1 ${accent || 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-[11px] font-medium mt-0.5 ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last period
        </p>
      )}
    </div>
  )
}
