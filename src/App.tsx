import { useState } from 'react'
import type { Page } from './types'
import { useGarments } from './hooks/useGarments'
import { useOutfits } from './hooks/useOutfits'
import { useAuth } from './lib/auth'
import BottomNav from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ClosetPage from './pages/ClosetPage'
import ScanPage from './pages/ScanPage'
import OutfitsPage from './pages/OutfitsPage'
import DeclutterPage from './pages/DeclutterPage'
import ProfilePage from './pages/ProfilePage'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [page, setPage] = useState<Page>('today')
  const { user } = useAuth()
  const { data: items = [], isLoading } = useGarments()
  const { data: outfits = [] } = useOutfits()

  if (!user) {
    return <AuthPage />
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
      }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 40,
            color: 'var(--accent)',
            animation: 'spin 1s linear infinite',
          }}
        >
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Fixed Top Header */}
      <header className="top-header">
        <div className="top-header-inner">
          <span className="top-header-title">DROBE</span>
        </div>
      </header>

      {page === 'today' && (
        <TodayPage
          items={items}
          savedOutfits={outfits}
          onNavigate={setPage}
        />
      )}
      {page === 'closet' && (
        <ClosetPage
          items={items}
        />
      )}
      {page === 'outfits' && (
        <OutfitsPage
          items={items}
          savedOutfits={outfits}
        />
      )}
      {page === 'scan' && (
        <ScanPage onNavigate={setPage} />
      )}
      {page === 'declutter' && (
        <DeclutterPage
          items={items}
          savedOutfits={outfits}
        />
      )}
      {page === 'profile' && (
        <ProfilePage
          items={items}
          outfits={outfits}
          onNavigate={setPage}
        />
      )}

      <BottomNav current={page} onChange={setPage} />
    </>
  )
}
