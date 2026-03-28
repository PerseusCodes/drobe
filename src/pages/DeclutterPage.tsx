import { useMemo } from 'react'
import { Recycle, Lightbulb, Shirt, Trash2 } from 'lucide-react'
import type { ClothingItem, Outfit } from '../types'
import { findDeclutterCandidates, findWardrobeGaps, generateOutfits } from '../utils/outfitEngine'

interface Props {
  items: ClothingItem[]
  savedOutfits: Outfit[]
  onDelete: (id: string) => void
}

export default function DeclutterPage({ items, savedOutfits, onDelete }: Props) {
  const allOutfits = useMemo(
    () => [...savedOutfits, ...generateOutfits(items, 'any', 'any', 50)],
    [items, savedOutfits]
  )

  const candidates = useMemo(
    () => findDeclutterCandidates(items, allOutfits),
    [items, allOutfits]
  )

  const gaps = useMemo(() => findWardrobeGaps(items), [items])

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <Recycle size={24} style={{ color: 'var(--accent)' }} /> Declutter
        </h1>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{candidates.length}</div>
          <div className="stat-label">Unused</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.length - candidates.length}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>

      {/* Declutter candidates */}
      <div className="section-label" style={{ marginTop: 8 }}>
        Consider Donating
      </div>

      {candidates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {candidates.map(item => (
            <div className="card declutter-item" key={item.id}>
              {item.imageUrl ? (
                <img className="declutter-thumb" src={item.imageUrl} alt={item.name} />
              ) : (
                <div
                  className="declutter-thumb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.color,
                  }}
                >
                  <Shirt size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
              )}
              <div className="declutter-info">
                <div className="declutter-name">{item.name}</div>
                <div className="declutter-reason">
                  {item.timesWorn === 0
                    ? 'Never worn'
                    : `Only worn ${item.timesWorn}x, doesn't match other items`}
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="empty-state" style={{ padding: '32px 24px' }}>
          <Recycle />
          <h3>All items are useful!</h3>
          <p>Every piece in your closet fits into at least one outfit combination</p>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '32px 24px' }}>
          <Recycle />
          <h3>Add items first</h3>
          <p>Scan clothing items into your closet to see declutter suggestions</p>
        </div>
      )}

      {/* Wardrobe gaps */}
      {gaps.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 24 }}>
            Wardrobe Gaps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gaps.map((gap, i) => (
              <div className="gap-card" key={i}>
                <Lightbulb />
                <p>{gap}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
