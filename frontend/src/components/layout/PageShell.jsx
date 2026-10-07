import TopBar from './TopBar'

export default function PageShell({ title, subtitle, onRefresh, children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <TopBar title={title} subtitle={subtitle} onRefresh={onRefresh} />
      <main className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
