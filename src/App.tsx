import { useState, lazy, Suspense } from 'react'
import LandingPage from './components/LandingPage'

const MDViewer = lazy(() => import('./components/MDViewer.jsx'))

function App() {
  const [view, setView] = useState<'landing' | 'editor'>('landing')

  if (view === 'editor') {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-[#0d1117] text-[#8b949e]">Loading editor…</div>}>
          <MDViewer />
        </Suspense>
      </div>
    )
  }

  return <LandingPage onLaunch={() => setView('editor')} />
}

export default App
