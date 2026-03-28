import { Home, Shirt, Camera, Sparkles, User } from 'lucide-react'
import type { Page } from '../types'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const tabs: { id: Page; label: string; icon: typeof Shirt }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'closet', label: 'Closet', icon: Shirt },
  { id: 'scan', label: 'Scan', icon: Camera },
  { id: 'outfits', label: 'Outfits', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ id, label, icon: Icon }) =>
        id === 'scan' ? (
          <button
            key={id}
            className={`nav-item scan-btn ${current === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <div className="scan-circle">
              <Icon />
            </div>
            <span>{label}</span>
          </button>
        ) : (
          <button
            key={id}
            className={`nav-item ${current === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  )
}
