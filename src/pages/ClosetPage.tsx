import { useState } from 'react'
import type { ClothingItem, Category } from '../types'
import ItemCard from '../components/ItemCard'
import ItemDetail from '../components/ItemDetail'
import { useToggleFavorite, useDeleteGarment, useLogWear } from '../hooks/useGarments'

interface Props {
  items: ClothingItem[]
}

const categories: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outer' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Acc.' },
  { id: 'activewear', label: 'Active' },
]

export default function ClosetPage({ items }: Props) {
  const toggleFavorite = useToggleFavorite()
  const deleteGarment = useDeleteGarment()
  const logWear = useLogWear()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClothingItem | null>(null)

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="page">
      {/* Header */}
      <section style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 200, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
          My Closet
        </h1>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--text-secondary)',
        }}>
          {items.length} items
        </span>
      </section>

      {/* Search */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 20,
              color: 'var(--text-muted)',
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search your archive"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              background: 'var(--bg-card)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'box-shadow 0.2s',
            }}
          />
        </div>
      </section>

      {/* Category filter */}
      <section style={{ marginBottom: 32 }}>
        <div className="chip-row">
          {categories.map(c => (
            <button
              key={c.id}
              className={`chip ${filter === c.id ? 'active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="item-grid">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleFav={id => {
                const garment = items.find(i => i.id === id)
                if (garment) toggleFavorite.mutate({ id, currentValue: garment.favorite })
              }}
              onClick={setSelected}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined">search</span>
          <h3 style={{ fontWeight: 500 }}>{items.length === 0 ? 'Your closet is empty' : 'No matches'}</h3>
          <p>
            {items.length === 0
              ? 'Tap the scan button below to add your first item'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      )}

      {selected && (
        <ItemDetail
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={id => {
            deleteGarment.mutate(id)
            setSelected(null)
          }}
          onLogWear={id => {
            const garment = items.find(i => i.id === id)
            if (garment) logWear.mutate({ id, currentTimesWorn: garment.timesWorn })
          }}
        />
      )}
    </div>
  )
}
