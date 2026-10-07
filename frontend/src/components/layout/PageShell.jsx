import TopBar from './TopBar'

export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fb]">
        {children}
      </main>
    </div>
  )
}
