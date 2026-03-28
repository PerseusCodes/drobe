import { useState } from 'react'
import type { Page } from './types'
import { useWardrobe } from './hooks/useWardrobe'
import BottomNav from './components/BottomNav'
import ClosetPage from './pages/ClosetPage'
import ScanPage from './pages/ScanPage'
import OutfitsPage from './pages/OutfitsPage'
import DeclutterPage from './pages/DeclutterPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const [page, setPage] = useState<Page>('closet')
  const wardrobe = useWardrobe()

  return (
    <>
      {page === 'closet' && (
        <ClosetPage
          items={wardrobe.items}
          onToggleFav={wardrobe.toggleFavorite}
          onDelete={wardrobe.deleteItem}
          onLogWear={wardrobe.logWear}
        />
      )}
      {page === 'outfits' && (
        <OutfitsPage
          items={wardrobe.items}
          savedOutfits={wardrobe.outfits}
          onSave={wardrobe.saveOutfit}
          onDeleteOutfit={wardrobe.deleteOutfit}
        />
      )}
      {page === 'scan' && (
        <ScanPage onAdd={wardrobe.addItem} onNavigate={setPage} />
      )}
      {page === 'declutter' && (
        <DeclutterPage
          items={wardrobe.items}
          savedOutfits={wardrobe.outfits}
          onDelete={wardrobe.deleteItem}
        />
      )}
      {page === 'profile' && (
        <ProfilePage items={wardrobe.items} outfits={wardrobe.outfits} />
      )}

      <BottomNav current={page} onChange={setPage} />
    </>
  )
}
