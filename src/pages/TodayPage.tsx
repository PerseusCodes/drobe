import { useMemo } from 'react'
import type { ClothingItem, Outfit, Page } from '../types'
import { generateOutfits } from '../utils/outfitEngine'

interface Props {
  items: ClothingItem[]
  savedOutfits: Outfit[]
  onNavigate: (page: Page) => void
}

function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TodayPage({ items, savedOutfits, onNavigate }: Props) {
  const season = getCurrentSeason()
  const greeting = getGreeting()

  const dailyOutfit = useMemo(() => {
    const outfits = generateOutfits(items, 'casual', season, 3)
    const dayIndex = new Date().getDate() % Math.max(outfits.length, 1)
    return outfits[dayIndex] || null
  }, [items, season])

  const getItem = (id: string) => items.find(i => i.id === id)

  const wardrobeScore = items.length > 0
    ? Math.round((items.filter(i => i.timesWorn > 0).length / items.length) * 100)
    : 0

  return (
    <div className="page">
      {/* Greeting */}
      <section style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--text)',
          opacity: 0.6,
          marginBottom: 4,
        }}>
          {season.charAt(0).toUpperCase() + season.slice(1)}
        </p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 300, letterSpacing: '-0.01em' }}>
          {greeting}
        </h1>
      </section>

      {/* Today's Outfit */}
      {dailyOutfit && items.length >= 2 ? (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="section-label" style={{ margin: 0 }}>Today's Outfit</span>
          </div>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            boxShadow: 'var(--shadow)',
          }}>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {dailyOutfit.items.map(id => {
                const item = getItem(id)
                if (!item) return null
                return (
                  <div key={id} style={{ minWidth: 120, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{
                      aspectRatio: '3/4',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      background: 'var(--bg-surface-low)',
                    }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)' }}>checkroom</span>
                        </div>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text)',
                      textAlign: 'center',
                    }}>
                      {item.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : items.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          textAlign: 'center',
          marginBottom: 32,
          boxShadow: 'var(--shadow)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }}>checkroom</span>
          <h3 style={{ marginBottom: 6, fontWeight: 500 }}>Your closet is empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Start by adding your first clothing item
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('scan')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span> Add Your First Item
          </button>
        </div>
      ) : null}

      {/* Stats Bento Grid */}
      <section style={{ marginBottom: 32 }}>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{items.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Outfits</span>
            <span className="stat-value">{savedOutfits.length}</span>
          </div>
          <div className="stat-card wide">
            <div>
              <span className="stat-label" style={{ color: 'var(--text-secondary)' }}>Wardrobe Score</span>
              <span className="stat-value">{wardrobeScore}%</span>
            </div>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '3px solid rgba(136, 77, 39, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span
                className="material-symbols-outlined"
                style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1, 'wght' 300" }}
              >
                auto_awesome
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <button
          className="btn btn-primary btn-full"
          style={{ height: 56, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
          onClick={() => onNavigate('scan')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
          Scan New Item
        </button>
        <button
          className="btn btn-secondary btn-full"
          style={{ height: 56, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
          onClick={() => onNavigate('closet')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>checkroom</span>
          Browse Closet
        </button>
      </section>

      {/* Seasonal Tip */}
      <div style={{
        background: 'rgba(136, 77, 39, 0.05)',
        borderRadius: 'var(--radius-2xl)',
        padding: 28,
        border: '1px solid rgba(136, 77, 39, 0.1)',
        textAlign: 'center',
      }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, color: 'var(--accent)', marginBottom: 12, fontVariationSettings: "'FILL' 1, 'wght' 300" }}
        >
          lightbulb
        </span>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 8 }}>
          Seasonal Tip
        </p>
        <p style={{ color: 'var(--text)', fontWeight: 300, lineHeight: 1.6, fontSize: '0.92rem' }}>
          {season === 'winter' && "Layer up! Check your outerwear section for cold-weather combos."}
          {season === 'spring' && "Transitional weather — light layers and versatile pieces work best."}
          {season === 'summer' && "Keep it light and breathable. Time to rotate in your summer pieces."}
          {season === 'fall' && "Perfect layering season. Mix outerwear with your lighter tops."}
        </p>
      </div>
    </div>
  )
}
