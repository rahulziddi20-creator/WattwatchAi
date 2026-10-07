import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import ScoreChip from '../components/ui/ScoreChip'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import AreaHeatmap from '../components/charts/AreaHeatmap'
import { getAreas, getInvestigations } from '../services/api'
import { fmt } from '../utils/formatters'
import { MapPin } from 'lucide-react'

export default function AreaIntelligence() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getAreas(), getInvestigations()])
      .then(([ar, inv]) => { setAreas(ar); setInvestigations(inv) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell title="Area Intelligence"><LoadingSpinner /></PageShell>
  if (error) return <PageShell title="Area Intelligence"><ErrorBanner message={error} /></PageShell>

  const areaAccounts = selected
    ? investigations.filter(i => i.area === selected).slice(0, 20)
    : []

  const totalFlagged = areas.reduce((s, a) => s + a.flagged_count, 0)
  const totalCritical = areas.reduce((s, a) => s + a.critical, 0)

  return (
    <PageShell title="Area Intelligence" subtitle="Locality-wise fraud concentration and cluster analysis">
      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Service Areas', value: areas.length },
          { label: 'Total Flagged', value: totalFlagged, color: 'text-amber-600' },
          { label: 'Critical Cases', value: totalCritical, color: 'text-red-600' },
          { label: 'Highest Risk Area', value: areas[0]?.area || '—', color: 'text-gray-800' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-[22px] font-bold ${k.color || 'text-gray-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Area cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {areas.map(a => (
          <button
            key={a.area}
            onClick={() => setSelected(selected === a.area ? null : a.area)}
            className={`text-left bg-white border rounded-lg p-3 transition-colors ${
              selected === a.area ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={11} className="text-gray-400" />
              <p className="text-[12px] font-bold text-gray-800">{a.area}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-gray-400">Total</span>
              <span className="font-semibold text-gray-700 text-right">{a.total_consumers}</span>
              <span className="text-gray-400">Flagged</span>
              <span className="font-semibold text-amber-600 text-right">{a.flagged_count}</span>
              <span className="text-gray-400">Critical</span>
              <span className="font-semibold text-red-600 text-right">{a.critical}</span>
              <span className="text-gray-400">Avg Risk</span>
              <span className="font-semibold text-gray-700 text-right">{a.avg_risk_score.toFixed(1)}</span>
            </div>
            {a.critical > 0 && (
              <div className="mt-2 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                Anomaly Cluster
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Area risk chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-[12px] font-semibold text-gray-700 mb-3">Area Risk Ranking — Average Risk Score</p>
        <AreaHeatmap areas={areas} />
      </div>

      {/* Area anomaly rate table */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[12px] font-semibold text-gray-700">Anomaly Rate by Area</p>
        </div>
        <table>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Area','Total Consumers','Flagged','Critical','High','Medium','Avg Risk Score','Anomaly Rate'].map(h => (
                <th key={h} className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {areas.map(a => {
              const rate = ((a.flagged_count / a.total_consumers) * 100).toFixed(1)
              return (
                <tr key={a.area} className="trow">
                  <td className="px-4 py-2.5 font-semibold text-gray-800 text-[12px]">{a.area}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-gray-600">{a.total_consumers}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-amber-600 font-medium">{a.flagged_count}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-red-600 font-medium">{a.critical}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-orange-500">{a.high}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-amber-600">{a.medium}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums font-semibold text-gray-700">{a.avg_risk_score.toFixed(1)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-gray-500 tabular-nums w-10 text-right">{rate}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Selected area accounts */}
      {selected && areaAccounts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-[12px] font-semibold text-gray-700">Suspicious Accounts — {selected}</p>
            <span className="text-[11px] text-gray-400">{areaAccounts.length} shown</span>
          </div>
          <table>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Consumer ID','Type','Current kWh','Baseline','Deviation','Risk Score',''].map(h => (
                  <th key={h} className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {areaAccounts.map(row => (
                <tr key={row.consumer_id} className="trow">
                  <td className="px-4 py-2.5">
                    <div className="font-mono text-[12px] font-bold text-blue-600">{row.consumer_id}</div>
                    <div className="text-[11px] text-gray-400">{row.name}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{row.connection_type}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] tabular-nums text-gray-700">{(row.current_units||0).toFixed(0)}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] tabular-nums text-gray-400">{(row.baseline_units||0).toFixed(0)}</td>
                  <td className="px-4 py-2.5">
                    <span style={{ color: (row.deviation_pct||0) < -30 ? '#dc2626' : '#6b7280' }}
                      className="font-mono text-[12px] tabular-nums font-medium">
                      {fmt.pct(row.deviation_pct)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><ScoreChip score={row.risk_score} level={row.risk_level} /></td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => navigate(`/investigation/${row.consumer_id}`)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700">
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
