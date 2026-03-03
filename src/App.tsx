import { useState } from 'react'
import MDViewer from './components/MDViewer.jsx'
import LandingPage from './components/LandingPage'

function App() {
  const [view, setView] = useState<'landing' | 'editor'>('landing')

  if (view === 'editor') {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <MDViewer />
      </div>
    )
  }

  return <LandingPage onLaunch={() => setView('editor')} />
}

export default App
