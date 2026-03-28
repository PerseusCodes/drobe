import { User, Shirt, Sparkles, Trash2, Download, RotateCcw } from 'lucide-react'
import type { ClothingItem, Outfit } from '../types'

interface Props {
  items: ClothingItem[]
  outfits: Outfit[]
}

export default function ProfilePage({ items, outfits }: Props) {
  const totalWears = items.reduce((sum, i) => sum + i.timesWorn, 0)
  const topCategory = items.length
    ? Object.entries(
        items.reduce<Record<string, number>>((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    : '—'

  const handleExport = () => {
    const data = { items, outfits, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drobe-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string)
          if (data.items) {
            localStorage.setItem('drobe_items', JSON.stringify(data.items))
          }
          if (data.outfits) {
            localStorage.setItem('drobe_outfits', JSON.stringify(data.outfits))
          }
          window.location.reload()
        } catch {
          alert('Invalid backup file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleClearAll = () => {
    if (confirm('This will delete all your wardrobe data. Are you sure?')) {
      localStorage.removeItem('drobe_items')
      localStorage.removeItem('drobe_outfits')
      window.location.reload()
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <User size={24} style={{ color: 'var(--accent)' }} /> Profile
        </h1>
      </div>

      {/* Avatar/Brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--display)',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: 'white',
            }}
          >
            D
          </span>
        </div>
        <h2 style={{ margin: 0 }}>DROBE</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Your digital wardrobe
        </span>
      </div>

      {/* Wardrobe stats */}
      <div className="profile-section">
        <h3>
          <Shirt size={16} style={{ marginRight: 6 }} />
          Wardrobe Stats
        </h3>
        <div className="profile-row">
          <span style={{ color: 'var(--text-muted)' }}>Total items</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{items.length}</span>
        </div>
        <div className="profile-row">
          <span style={{ color: 'var(--text-muted)' }}>Saved outfits</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{outfits.length}</span>
        </div>
        <div className="profile-row">
          <span style={{ color: 'var(--text-muted)' }}>Total wears logged</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{totalWears}</span>
        </div>
        <div className="profile-row">
          <span style={{ color: 'var(--text-muted)' }}>Top category</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>
            {topCategory}
          </span>
        </div>
        <div className="profile-row">
          <span style={{ color: 'var(--text-muted)' }}>Favorites</span>
          <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>
            {items.filter(i => i.favorite).length}
          </span>
        </div>
      </div>

      {/* Data management */}
      <div className="profile-section">
        <h3>
          <Sparkles size={16} style={{ marginRight: 6 }} />
          Data
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary btn-full" onClick={handleExport}>
            <Download size={16} /> Export Backup
          </button>
          <button className="btn btn-secondary btn-full" onClick={handleImport}>
            <RotateCcw size={16} /> Import Backup
          </button>
          <button className="btn btn-danger btn-full" onClick={handleClearAll}>
            <Trash2 size={16} /> Clear All Data
          </button>
        </div>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: 16,
          opacity: 0.6,
        }}
      >
        DROBE v1.0 — All data stored locally on your device
      </p>
    </div>
  )
}
