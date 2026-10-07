export const fmt = {
  number: (n) => (n ?? 0).toLocaleString('en-IN'),
  units: (n) => `${(n ?? 0).toLocaleString('en-IN')} kWh`,
  currency: (n) => `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  pct: (n) => `${n >= 0 ? '+' : ''}${(n ?? 0).toFixed(1)}%`,
  score: (n) => (n ?? 0).toFixed(1),
}
