import TopBar from './TopBar'

export default function PageShell({ title, subtitle, children, noPad }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <TopBar title={title} subtitle={subtitle} />
      <main className={`flex-1 overflow-y-auto ${noPad ? '' : 'p-5'} bg-[#f0f2f5]`}>
        {children}
      </main>
    </div>
  )
}
