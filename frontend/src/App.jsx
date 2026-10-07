import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Overview from './pages/Overview'
import ConsumerInvestigation from './pages/ConsumerInvestigation'
import InvestigationQueue from './pages/InvestigationQueue'
import Analytics from './pages/Analytics'
import AreaIntelligence from './pages/AreaIntelligence'
import AIWorkspace from './pages/AIWorkspace'
import Compliance from './pages/Compliance'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/investigation" element={<ConsumerInvestigation />} />
            <Route path="/investigation/:consumerId" element={<ConsumerInvestigation />} />
            <Route path="/queue" element={<InvestigationQueue />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/areas" element={<AreaIntelligence />} />
            <Route path="/ai-workspace" element={<AIWorkspace />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
