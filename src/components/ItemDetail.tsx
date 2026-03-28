import { X, Trash2, CheckCircle, Shirt } from 'lucide-react'
import type { ClothingItem } from '../types'

interface Props {
  item: ClothingItem
  onClose: () => void
  onDelete: (id: string) => void
  onLogWear: (id: string) => void
}

export default function ItemDetail({ item, onClose, onDelete, onLogWear }: Props) {
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
            <Shirt />
          </div>
        )}

        <h2>{item.name}</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
          <span className="chip active">{item.category}</span>
          {item.season.map(s => (
            <span className="chip" key={s}>{s}</span>
          ))}
          {item.occasions.map(o => (
            <span className="chip" key={o}>{o}</span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <span className="color-dot" style={{ background: item.color }} />
          <span>{item.colorName}</span>
          <span style={{ margin: '0 4px' }}>|</span>
          <span>Worn {item.timesWorn} times</span>
          {item.brand && (
            <>
              <span style={{ margin: '0 4px' }}>|</span>
              <span>{item.brand}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary btn-full" onClick={() => onLogWear(item.id)}>
            <CheckCircle size={18} /> Log Wear
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-danger btn-full" onClick={() => onDelete(item.id)}>
            <Trash2 size={18} /> Remove
          </button>
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            <X size={18} /> Close
          </button>
        </div>
      </div>
    </>
  )
}
