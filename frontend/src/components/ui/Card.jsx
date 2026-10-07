/** White card container */
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {children}
    </div>
  )
}

/** Card header with title + optional right content */
export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100">
      <div>
        <p className="text-[13px] font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 ml-4">{right}</div>}
    </div>
  )
}

/** Card body */
export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

/** Key-value field */
export function Field({ label, value, mono, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-[13px] font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value ?? '—'}</p>
    </div>
  )
}

/** Section divider with label */
export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{children}</p>
  )
}
