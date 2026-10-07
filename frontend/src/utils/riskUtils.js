// Risk level helpers — single source of truth
export const RISK_META = {
  Low:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e', bar: '#16a34a' },
  Medium:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#f59e0b', bar: '#d97706' },
  High:     { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', dot: '#f97316', bar: '#ea580c' },
  Critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#ef4444', bar: '#dc2626' },
}

export function getRiskMeta(level) {
  return RISK_META[level] || RISK_META.Low
}

export function scoreToLevel(score) {
  if (score < 30) return 'Low'
  if (score < 60) return 'Medium'
  if (score < 80) return 'High'
  return 'Critical'
}

export const STATUS_META = {
  Open:        { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  'In Review': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  Escalated:   { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  Monitoring:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Closed:      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
}
