import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

export default function ConsumptionChart({ history, baseline }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const data = (history || []).map((v, i) => ({
    month: months[i] || `M${i + 1}`,
    usage: v,
    baseline: Math.round(baseline || 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
        <Tooltip
          contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}
          formatter={(v, name) => [`${v} kWh`, name === 'usage' ? 'Actual' : 'Baseline']}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="usage" name="usage" fill="#3b82f6" opacity={0.8} radius={[2, 2, 0, 0]} />
        <Line
          type="monotone" dataKey="baseline" name="baseline"
          stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 4" dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
