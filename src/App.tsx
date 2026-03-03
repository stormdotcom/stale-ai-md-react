import { useState, lazy, Suspense, useEffect } from 'react'
import LandingPage from './components/LandingPage'

const MDViewer = lazy(() => import('./components/MDViewer.jsx'))

function App() {
  const [view, setView] = useState<'landing' | 'editor'>(() => {
    if (typeof window === 'undefined') return 'landing'
    return window.location.hash.includes('session=') ? 'editor' : 'landing'
  })

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.includes('session=')) setView('editor')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (view === 'editor') {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Suspense fallback={
          <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-[#0d1117] text-[#8b949e]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]" />
            <span className="text-sm">Loading editor…</span>
          </div>
        }>
          <MDViewer />
        </Suspense>
      </div>
    )
  }

  return <LandingPage onLaunch={() => setView('editor')} />
}

export default App
