import { useState } from 'react'
import type { ClothingItem } from '../types'
import { getCombinedCare } from '../utils/careInstructions'

interface Props {
  item: ClothingItem
  onClose: () => void
  onDelete: (id: string) => void
  onLogWear: (id: string) => void
}

export default function ItemDetail({ item, onClose, onDelete, onLogWear }: Props) {
  const [showLabel, setShowLabel] = useState(false)
  const care = item.fabrics?.length ? getCombinedCare(item.fabrics) : null

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: '100%',
              height: 240,
              objectFit: 'cover',
              borderRadius: 'var(--radius)',
              marginBottom: 16,
            }}
          />
        ) : (
          <div
            className="img-placeholder"
            style={{ height: 200, borderRadius: 'var(--radius)', marginBottom: 16 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 40 }}>checkroom</span>
          </div>
        )}

        <h2 style={{ fontSize: '1.3rem', fontWeight: 500 }}>{item.name}</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
          <span className="chip active">{item.category}</span>
          {item.season.map(s => (
            <span className="chip" key={s}>{s}</span>
          ))}
          {item.occasions.map(o => (
            <span className="chip" key={o}>{o}</span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
          <span className="color-dot" style={{ background: item.color }} />
          <span>{item.colorName}</span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
          <span>Worn {item.timesWorn} times</span>
          {item.brand && (
            <>
              <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
              <span>{item.brand}</span>
            </>
          )}
        </div>

        {/* Fabric & Care section */}
        {(item.fabrics?.length || item.labelImageUrl) && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>label</span> Fabric & Care
            </div>

            {item.fabrics?.length ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {item.fabrics.map(f => (
                  <span className="chip" key={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </span>
                ))}
              </div>
            ) : null}

            {care && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="gap-card" style={{ padding: 12 }}>
                  <span className="material-symbols-outlined">water_drop</span>
                  <p style={{ fontSize: '0.82rem' }}><strong>Wash:</strong> {care.wash}</p>
                </div>
                <div className="gap-card" style={{ padding: 12 }}>
                  <span className="material-symbols-outlined">air</span>
                  <p style={{ fontSize: '0.82rem' }}><strong>Dry:</strong> {care.dry}</p>
                </div>
                <div className="gap-card" style={{ padding: 12 }}>
                  <span className="material-symbols-outlined">local_fire_department</span>
                  <p style={{ fontSize: '0.82rem' }}><strong>Iron:</strong> {care.iron}</p>
                </div>
                <div className="gap-card" style={{ padding: 12 }}>
                  <span className="material-symbols-outlined">lightbulb</span>
                  <p style={{ fontSize: '0.82rem' }}><strong>Tips:</strong> {care.tips}</p>
                </div>
              </div>
            )}

            {item.labelImageUrl && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-ghost btn-full"
                  style={{ fontSize: '0.82rem' }}
                  onClick={() => setShowLabel(!showLabel)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>label</span>
                  {showLabel ? 'Hide' : 'View'} Care Label Photo
                </button>
                {showLabel && (
                  <img
                    src={item.labelImageUrl}
                    alt="Care label"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-sm)',
                      marginTop: 8,
                      border: '1px solid var(--border)',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary btn-full" onClick={() => onLogWear(item.id)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> Log Wear
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-danger btn-full" onClick={() => onDelete(item.id)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span> Remove
          </button>
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span> Close
          </button>
        </div>
      </div>
    </>
  )
}
