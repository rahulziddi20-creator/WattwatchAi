// Risk level → color classes and labels
export const RISK_COLORS = {
  Low: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', bar: '#16a34a' },
  Medium: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', bar: '#d97706' },
  High: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', bar: '#dc2626' },
  Critical: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', bar: '#7c3aed' },
}

export function getRiskColor(level) {
  return RISK_COLORS[level] || RISK_COLORS.Low
}

export function getRiskLabel(score) {
  if (score < 30) return 'Low'
  if (score < 60) return 'Medium'
  if (score < 80) return 'High'
  return 'Critical'
}

export const STATUS_COLORS = {
  Open: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  'In Review': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Escalated: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  Monitoring: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Closed: { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
}
