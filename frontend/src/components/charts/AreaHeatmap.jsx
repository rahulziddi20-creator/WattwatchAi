import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

export default function AreaHeatmap({ areas = [] }) {
  const data = [...areas]
    .sort((a, b) => b.avg_risk_score - a.avg_risk_score)
    .slice(0, 8)
    .map((a) => ({ area: a.area, risk: a.avg_risk_score, flagged: a.flagged_count }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={72} />
        <Tooltip
          contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}
          formatter={(v, name) => [
            name === 'risk' ? `${v.toFixed(1)}/100` : v,
            name === 'risk' ? 'Avg Risk Score' : 'Flagged',
          ]}
        />
        <Bar dataKey="risk" name="risk" fill="#3b82f6" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
