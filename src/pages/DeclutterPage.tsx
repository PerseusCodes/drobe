import { useState, useMemo } from 'react'
import type { ClothingItem, Outfit } from '../types'
import { findDeclutterCandidates, findWardrobeGaps, generateOutfits } from '../utils/outfitEngine'
import { useDeleteGarment } from '../hooks/useGarments'

interface Props {
  items: ClothingItem[]
  savedOutfits: Outfit[]
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 999
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export default function DeclutterPage({ items, savedOutfits }: Props) {
  const deleteGarment = useDeleteGarment()
  const allOutfits = useMemo(
    () => [...savedOutfits, ...generateOutfits(items, 'any', 'any', 50)],
    [items, savedOutfits]
  )

  const candidates = useMemo(
    () => findDeclutterCandidates(items, allOutfits),
    [items, allOutfits]
  )

  const gaps = useMemo(() => findWardrobeGaps(items), [items])

  const [currentIndex, setCurrentIndex] = useState(0)

  const current = candidates[currentIndex]
  const total = candidates.length
  const reviewed = currentIndex

  const handleKeep = () => {
    if (currentIndex < total - 1) setCurrentIndex(i => i + 1)
  }

  const handleRemove = () => {
    if (current) {
      deleteGarment.mutate(current.id)
      // candidates will re-compute, index stays or adjusts
      if (currentIndex >= candidates.length - 1 && currentIndex > 0) {
        setCurrentIndex(i => i - 1)
      }
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 300 }}>Declutter</h1>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            opacity: 0.6,
          }}>
            {reviewed} / {total} items
          </span>
        </div>
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 3,
          borderRadius: 2,
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: total > 0 ? `${(reviewed / total) * 100}%` : '0%',
            background: 'var(--accent)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </section>

      {/* Swipe card */}
      {current ? (
        <>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            {/* Stack effect */}
            {total - currentIndex > 2 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                transform: 'scale(0.92) translateY(16px)',
                opacity: 0.4,
                boxShadow: 'var(--shadow-sm)',
              }} />
            )}
            {total - currentIndex > 1 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                transform: 'scale(0.96) translateY(8px)',
                opacity: 0.7,
                boxShadow: 'var(--shadow)',
              }} />
            )}

            {/* Active card */}
            <div className="declutter-card">
              <div style={{ position: 'relative' }}>
                {current.imageUrl ? (
                  <img className="declutter-img" src={current.imageUrl} alt={current.name} />
                ) : (
                  <div className="declutter-img" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: current.color || 'var(--bg-elevated)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }}>checkroom</span>
                  </div>
                )}
              </div>

              <div className="declutter-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 className="declutter-name">{current.name}</h2>
                    <p className="declutter-reason">
                      Added {current.dateAdded}
                    </p>
                  </div>
                </div>

                <div className="declutter-stats">
                  <div className="declutter-stat">
                    <span className="stat-num">{current.timesWorn}</span>
                    <span className="stat-txt">Times Worn</span>
                  </div>
                  <div className="declutter-stat">
                    <span className="stat-num">{current.lastWorn ? `${daysSince(current.lastWorn)}d` : '—'}</span>
                    <span className="stat-txt">Last Worn</span>
                  </div>
                  <div className="declutter-stat" style={{ border: '1px solid rgba(136, 77, 39, 0.1)' }}>
                    <span className="stat-num">{daysSince(current.dateAdded)}</span>
                    <span className="stat-txt">Days Owned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 8 }}>
            <button onClick={handleRemove} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                transition: 'transform 0.2s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Remove</span>
            </button>

            <button onClick={handleKeep} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 16px rgba(136, 77, 39, 0.3)',
                transition: 'transform 0.2s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1, 'wght' 300" }}>favorite</span>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Keep</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 300 }}>
            Swipe right if it sparks joy, left to let it go.
          </p>
        </>
      ) : items.length > 0 ? (
        <div className="empty-state" style={{ padding: '48px 24px' }}>
          <span className="material-symbols-outlined">recycling</span>
          <h3 style={{ fontWeight: 500 }}>All items are useful!</h3>
          <p>Every piece in your closet fits into at least one outfit combination</p>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '48px 24px' }}>
          <span className="material-symbols-outlined">recycling</span>
          <h3 style={{ fontWeight: 500 }}>Add items first</h3>
          <p>Scan clothing items into your closet to see declutter suggestions</p>
        </div>
      )}

      {/* Wardrobe gaps */}
      {gaps.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="section-label">Wardrobe Gaps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gaps.map((gap, i) => (
              <div className="gap-card" key={i}>
                <span className="material-symbols-outlined">lightbulb</span>
                <p>{gap}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
