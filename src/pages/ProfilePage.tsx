import type { ClothingItem, Outfit, Page } from '../types'
import { useAuth } from '../lib/auth'

interface Props {
  items: ClothingItem[]
  outfits: Outfit[]
  onNavigate: (page: Page) => void
}

export default function ProfilePage({ items, outfits, onNavigate }: Props) {
  const { signOut } = useAuth()
  const totalWears = items.reduce((sum, i) => sum + i.timesWorn, 0)
  const topCategory = items.length
    ? Object.entries(
        items.reduce<Record<string, number>>((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    : '—'

  return (
    <div className="page">
      {/* Profile Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)',
            border: '4px solid var(--bg-card)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'white' }}>checkroom</span>
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            color: 'white',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)',
            border: '2px solid var(--bg-card)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
          </div>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 2 }}>My Closet</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-row" style={{ marginBottom: 28 }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <span className="stat-label">Total Items</span>
          <span className="stat-value" style={{ fontWeight: 700 }}>{items.length}</span>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <span className="stat-label">Curations</span>
          <span className="stat-value" style={{ fontWeight: 700 }}>{outfits.length}</span>
        </div>
      </div>

      {/* Settings List */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-secondary)',
          opacity: 0.4,
          padding: '0 8px',
          marginBottom: 12,
        }}>
          Account Overview
        </p>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}>
          <SettingsRow icon="checkroom" label={`Top category: ${topCategory}`} />
          <SettingsRow icon="favorite" label={`${items.filter(i => i.favorite).length} favorites`} />
          <SettingsRow icon="repeat" label={`${totalWears} total wears logged`} />
          <SettingsRow icon="recycling" label="Declutter assistant" onClick={() => onNavigate('declutter')} />
        </div>
      </div>

      {/* Account Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-secondary)',
          opacity: 0.4,
          padding: '0 8px',
          marginBottom: 12,
        }}>
          Account
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-danger btn-full" style={{ height: 48 }} onClick={() => signOut()}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Sign Out
          </button>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--text-muted)',
        marginTop: 8,
        opacity: 0.4,
      }}>
        DROBE v1.0 — Powered by Supabase
      </p>
    </div>
  )
}

function SettingsRow({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.9rem' }}>{label}</span>
      </div>
      {onClick && <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--border-light)' }}>chevron_right</span>}
    </button>
  )
}
