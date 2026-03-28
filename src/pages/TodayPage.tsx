import { useMemo } from 'react'
import { Sun, Plus, Sparkles, Shirt, ArrowRight, Haze } from 'lucide-react'
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

function getSeasonEmoji(s: string): string {
  switch (s) {
    case 'spring': return '\u{1F338}'
    case 'summer': return '\u{2600}\u{FE0F}'
    case 'fall': return '\u{1F342}'
    case 'winter': return '\u{2744}\u{FE0F}'
    default: return ''
  }
}

export default function TodayPage({ items, savedOutfits, onNavigate }: Props) {
  const season = getCurrentSeason()
  const greeting = getGreeting()

  // Generate a daily outfit suggestion
  const dailyOutfit = useMemo(() => {
    const outfits = generateOutfits(items, 'casual', season, 3)
    // Pick one based on the day so it's stable for the whole day
    const dayIndex = new Date().getDate() % Math.max(outfits.length, 1)
    return outfits[dayIndex] || null
  }, [items, season])

  const getItem = (id: string) => items.find(i => i.id === id)

  const recentItems = items.slice(0, 4)

  return (
    <div className="page">
      {/* Greeting */}
      <div style={{ paddingTop: 8, marginBottom: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>
          {getSeasonEmoji(season)} {season.charAt(0).toUpperCase() + season.slice(1)}
        </p>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{greeting}</h1>
      </div>

      {/* Quick stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{savedOutfits.length}</div>
          <div className="stat-label">Outfits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.reduce((s, i) => s + i.timesWorn, 0)}</div>
          <div className="stat-label">Wears</div>
        </div>
      </div>

      {/* Daily outfit suggestion */}
      {dailyOutfit && items.length >= 2 ? (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">Today's Outfit</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.95rem' }}>
                {dailyOutfit.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {dailyOutfit.items.map(id => {
                const item = getItem(id)
                if (!item) return null
                return item.imageUrl ? (
                  <img
                    key={id}
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: 72,
                      height: 96,
                      borderRadius: 'var(--radius-xs)',
                      objectFit: 'cover',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    key={id}
                    style={{
                      width: 72,
                      height: 96,
                      borderRadius: 'var(--radius-xs)',
                      background: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    <Shirt size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <span className="chip active">{dailyOutfit.occasion}</span>
              <span className="chip">{dailyOutfit.season}</span>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <Haze size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
          <h3 style={{ marginBottom: 6 }}>Your closet is empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            Start by adding your first clothing item
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('scan')}>
            <Plus size={18} /> Add Your First Item
          </button>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="section-label">Quick Actions</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className="card"
          onClick={() => onNavigate('scan')}
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-card)',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Plus size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-bright)' }}>
            Add Item
          </span>
        </button>

        <button
          className="card"
          onClick={() => onNavigate('outfits')}
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-card)',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-bright)' }}>
            Get Outfits
          </span>
        </button>

        <button
          className="card"
          onClick={() => onNavigate('closet')}
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-card)',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shirt size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-bright)' }}>
            My Closet
          </span>
        </button>
      </div>

      {/* Recently added */}
      {recentItems.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-label" style={{ margin: 0 }}>Recently Added</span>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              onClick={() => onNavigate('closet')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
            {recentItems.map(item => (
              <div
                key={item.id}
                className="card"
                style={{ flexShrink: 0, width: 120 }}
                onClick={() => onNavigate('closet')}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: 140,
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Shirt size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  </div>
                )}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--text-bright)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <span className="color-dot" style={{ background: item.color, width: 10, height: 10 }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.colorName.split(',')[0]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Seasonal tip */}
      <div className="card" style={{ padding: 16, marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Sun size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
            {season === 'winter' && "Layer up! Check your outerwear section for cold-weather combos."}
            {season === 'spring' && "Transitional weather — light layers and versatile pieces work best."}
            {season === 'summer' && "Keep it light and breathable. Time to rotate in your summer pieces."}
            {season === 'fall' && "Perfect layering season. Mix outerwear with your lighter tops."}
          </p>
        </div>
      </div>
    </div>
  )
}
