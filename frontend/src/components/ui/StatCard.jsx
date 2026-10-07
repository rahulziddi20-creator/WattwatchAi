export default function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded p-4">
      <p className="text-xs text-[#475569] mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${accent || 'text-[#0f172a]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  )
}
