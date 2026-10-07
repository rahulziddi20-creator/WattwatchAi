const RISK_STYLES = {
  Low:      { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', bar: '#16a34a' },
  Medium:   { dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', bar: '#d97706' },
  High:     { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   bar: '#dc2626' },
  Critical: { dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200',bar: '#7c3aed' },
}

export function getRiskColor(level) {
  return RISK_STYLES[level] || RISK_STYLES.Low
}

export function getRiskLabel(score) {
  if (score < 30) return 'Low'
  if (score < 60) return 'Medium'
  if (score < 80) return 'High'
  return 'Critical'
}

export const STATUS_STYLES = {
  Open:       { text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'    },
  'In Review':{ text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
  Escalated:  { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  Monitoring: { text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  Closed:     { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200'  },
}
