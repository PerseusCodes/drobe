import { useState, useMemo } from 'react'
import { Sparkles, Bookmark, Shirt, RefreshCw } from 'lucide-react'
import type { ClothingItem, Outfit, Occasion, Season } from '../types'
import { generateOutfits } from '../utils/outfitEngine'

interface Props {
  items: ClothingItem[]
  savedOutfits: Outfit[]
  onSave: (outfit: Outfit) => void
  onDeleteOutfit: (id: string) => void
}

const OCCASIONS: (Occasion | 'any')[] = ['any', 'casual', 'work', 'formal', 'athletic', 'night-out', 'date']
const SEASONS: (Season | 'any')[] = ['any', 'spring', 'summer', 'fall', 'winter']

export default function OutfitsPage({ items, savedOutfits, onSave, onDeleteOutfit }: Props) {
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
    <div className="card outfit-card" key={outfit.id}>
      <div className="outfit-name">{outfit.name}</div>
      <div className="outfit-tags">
        <span className="chip active">{outfit.occasion}</span>
        <span className="chip">{outfit.season}</span>
      </div>
      <div className="outfit-items">
        {outfit.items.map(id => {
          const item = getItem(id)
          return item ? (
            item.imageUrl ? (
              <img
                key={id}
                className="outfit-thumb"
                src={item.imageUrl}
                alt={item.name}
              />
            ) : (
              <div
                key={id}
                className="outfit-thumb"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.color,
                }}
              >
                <Shirt size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
              </div>
            )
          ) : null
        })}
      </div>
      <div className="outfit-actions">
        {isSaved ? (
          <button className="btn btn-danger" onClick={() => onDeleteOutfit(outfit.id)}>
            Remove
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => onSave({ ...outfit, saved: true })}
          >
            <Bookmark size={16} /> Save
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <Sparkles size={24} style={{ color: 'var(--accent)' }} /> Outfits
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`chip ${tab === 'generate' ? 'active' : ''}`}
          onClick={() => setTab('generate')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Sparkles size={14} /> Suggestions
        </button>
        <button
          className={`chip ${tab === 'saved' ? 'active' : ''}`}
          onClick={() => setTab('saved')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Bookmark size={14} /> Saved ({savedOutfits.length})
        </button>
      </div>

      {tab === 'generate' ? (
        <>
          {/* Filters */}
          <div className="section-label">Occasion</div>
          <div className="chip-row" style={{ marginBottom: 12 }}>
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
          <div className="chip-row" style={{ marginBottom: 16 }}>
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
            style={{ marginBottom: 16 }}
            onClick={() => setSeed(s => s + 1)}
          >
            <RefreshCw size={16} /> Regenerate
          </button>

          {generated.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {generated.map(o => renderOutfitCard(o, false))}
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles />
              <h3>Not enough items</h3>
              <p>
                Add more clothing items to your closet to generate outfit combinations
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {savedOutfits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {savedOutfits.map(o => renderOutfitCard(o, true))}
            </div>
          ) : (
            <div className="empty-state">
              <Bookmark />
              <h3>No saved outfits</h3>
              <p>Generate outfits and save the ones you like</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
