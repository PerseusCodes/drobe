import { useState, useMemo } from 'react'
import type { ClothingItem, Outfit, Occasion, Season } from '../types'
import { generateOutfits } from '../utils/outfitEngine'
import { useSaveOutfit, useDeleteOutfit } from '../hooks/useOutfits'

interface Props {
  items: ClothingItem[]
  savedOutfits: Outfit[]
}

const OCCASIONS: (Occasion | 'any')[] = ['any', 'casual', 'work', 'formal', 'athletic', 'night-out', 'date']
const SEASONS: (Season | 'any')[] = ['any', 'spring', 'summer', 'fall', 'winter']

export default function OutfitsPage({ items, savedOutfits }: Props) {
  const saveOutfit = useSaveOutfit()
  const deleteOutfit = useDeleteOutfit()
  const [occasion, setOccasion] = useState<Occasion | 'any'>('any')
  const [season, setSeason] = useState<Season | 'any'>('any')
  const [tab, setTab] = useState<'generate' | 'saved'>('generate')
  const [seed, setSeed] = useState(0)

  const generated = useMemo(
    () => generateOutfits(items, occasion, season, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, occasion, season, seed]
  )

  const getItem = (id: string) => items.find(i => i.id === id)

  const renderOutfitCard = (outfit: Outfit, isSaved: boolean) => (
    <div className="outfit-card" key={outfit.id}>
      {/* Item thumbnails */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, overflow: 'hidden' }}>
        {/* Main item (larger) */}
        {outfit.items[0] && (() => {
          const item = getItem(outfit.items[0])
          return item ? (
            <div style={{ flex: 1, aspectRatio: '3/4', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-surface-low)' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)' }}>checkroom</span>
                </div>
              )}
            </div>
          ) : null
        })()}
        {/* Secondary items (stacked) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outfit.items.slice(1, 3).map(id => {
            const item = getItem(id)
            return item ? (
              <div key={id} style={{ flex: 1, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-surface-low)' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>checkroom</span>
                  </div>
                )}
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Tags + Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            display: 'inline-flex',
            padding: '5px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 9999,
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            width: 'fit-content',
          }}>
            {outfit.occasion}
          </span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {outfit.name}
          </p>
        </div>
        {isSaved ? (
          <button
            onClick={() => deleteOutfit.mutate(outfit.id)}
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        ) : (
          <button
            onClick={() => saveOutfit.mutate({
              name: outfit.name,
              occasion: outfit.occasion,
              season: outfit.season,
              itemIds: outfit.items,
            })}
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              color: 'white',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(136, 77, 39, 0.25)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>bookmark</span>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="page">
      {/* Header */}
      <section style={{ marginBottom: 24 }}>
        <p className="section-label" style={{ marginBottom: 4 }}>Curated for You</p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 300 }}>Outfits</h1>
      </section>

      {/* Tab Toggle */}
      <div className="tab-toggle">
        <button
          className={tab === 'generate' ? 'active' : ''}
          onClick={() => setTab('generate')}
        >
          Suggested
        </button>
        <button
          className={tab === 'saved' ? 'active' : ''}
          onClick={() => setTab('saved')}
        >
          Saved ({savedOutfits.length})
        </button>
      </div>

      {tab === 'generate' ? (
        <>
          {/* Filters */}
          <div className="section-label">Occasion</div>
          <div className="chip-row" style={{ marginBottom: 16 }}>
            {OCCASIONS.map(o => (
              <button
                key={o}
                className={`chip ${occasion === o ? 'active' : ''}`}
                onClick={() => setOccasion(o)}
              >
                {o === 'any' ? 'Any' : o.charAt(0).toUpperCase() + o.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="section-label">Season</div>
          <div className="chip-row" style={{ marginBottom: 20 }}>
            {SEASONS.map(s => (
              <button
                key={s}
                className={`chip ${season === s ? 'active' : ''}`}
                onClick={() => setSeason(s)}
              >
                {s === 'any' ? 'Any' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary btn-full"
            style={{ marginBottom: 24, height: 48 }}
            onClick={() => setSeed(s => s + 1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span> Regenerate
          </button>

          {generated.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {generated.map(o => renderOutfitCard(o, false))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h3 style={{ fontWeight: 500 }}>Not enough items</h3>
              <p>Add more clothing items to your closet to generate outfit combinations</p>
            </div>
          )}
        </>
      ) : (
        <>
          {savedOutfits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {savedOutfits.map(o => renderOutfitCard(o, true))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined">bookmark</span>
              <h3 style={{ fontWeight: 500 }}>No saved outfits</h3>
              <p>Generate outfits and save the ones you like</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
