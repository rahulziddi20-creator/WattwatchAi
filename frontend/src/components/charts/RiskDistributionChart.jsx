import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626', Critical: '#7c3aed' }

export default function RiskDistributionChart({ distribution = {} }) {
  const data = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data} dataKey="value" nameKey="name"
          cx="50%" cy="50%" innerRadius={55} outerRadius={80}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4 }}
          formatter={(v, name) => [v, `${name} Risk`]}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
