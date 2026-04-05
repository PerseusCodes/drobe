import type { Page } from '../types'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const tabs: { id: Page; icon: string }[] = [
  { id: 'today', icon: 'light_mode' },
  { id: 'closet', icon: 'checkroom' },
  { id: 'scan', icon: 'add_circle' },
  { id: 'outfits', icon: 'auto_awesome' },
  { id: 'profile', icon: 'person' },
]

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ id, icon }) => (
        <button
          key={id}
          className={`nav-item ${current === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <span
            className="material-symbols-outlined"
            style={current === id ? { fontVariationSettings: "'FILL' 1, 'wght' 300" } : undefined}
          >
            {icon}
          </span>
        </button>
      ))}
    </nav>
  )
}
