import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import RiskBadge from '../components/ui/RiskBadge'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getAreas, getInvestigations } from '../services/api'
import { fmt } from '../utils/formatters'

export default function AreaIntelligence() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([getAreas(), getInvestigations()])
      .then(([ar, inv]) => { setAreas(ar); setInvestigations(inv) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Area Intelligence"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Area Intelligence"><ErrorBanner message={error} /></PageShell>

  const areaConsumers = selected
    ? investigations.filter((i) => i.area === selected).slice(0, 15)
    : []

  return (
    <PageShell title="Area / Cluster Intelligence" subtitle="Locality-wise fraud concentration analysis">
      {/* Area summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {areas.map((a) => (
          <button
            key={a.area}
            onClick={() => setSelected(selected === a.area ? null : a.area)}
            className={`text-left bg-white border rounded p-3 transition-colors ${
              selected === a.area ? 'border-blue-400 ring-1 ring-blue-300' : 'border-[#e2e8f0] hover:border-blue-200'
            }`}
          >
            <p className="text-xs font-semibold text-[#0f172a] mb-1">{a.area}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-[#475569]">
              <span>Total</span><span className="font-mono font-medium text-right">{a.total_consumers}</span>
              <span>Flagged</span><span className="font-mono font-medium text-right text-amber-600">{a.flagged_count}</span>
              <span>Critical</span><span className="font-mono font-medium text-right text-purple-700">{a.critical}</span>
              <span>Avg Risk</span><span className="font-mono font-medium text-right">{a.avg_risk_score.toFixed(1)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 mb-4">
        <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-3">Average Risk Score by Area</p>
        <AreaHeatmap areas={areas} />
      </div>

      {/* Selected area consumers */}
      {selected && (
        <div className="bg-white border border-[#e2e8f0] rounded">
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">
              Suspicious Accounts — {selected}
            </p>
            <span className="text-xs text-slate-400">{areaConsumers.length} shown</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f8f9fb] border-b border-[#e2e8f0]">
                {['Consumer ID','Name','Category','Current (kWh)','Baseline','Deviation','Risk Score','Risk Level',''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-[#475569]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areaConsumers.map((row, i) => (
                <tr key={row.consumer_id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fb]'}>
                  <td className="px-3 py-2 font-mono text-blue-600">{row.consumer_id}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-[#475569]">{row.connection_type}</td>
                  <td className="px-3 py-2 font-mono">{(row.current_units || 0).toFixed(0)}</td>
                  <td className="px-3 py-2 font-mono text-[#475569]">{(row.baseline_units || 0).toFixed(0)}</td>
                  <td className={`px-3 py-2 font-mono ${row.deviation_pct < -30 ? 'text-red-600 font-medium' : 'text-[#475569]'}`}>
                    {fmt.pct(row.deviation_pct)}
                  </td>
                  <td className="px-3 py-2 font-semibold">{(row.risk_score || 0).toFixed(1)}</td>
                  <td className="px-3 py-2"><RiskBadge level={row.risk_level} /></td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
