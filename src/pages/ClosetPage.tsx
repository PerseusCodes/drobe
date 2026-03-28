import { useState } from 'react'
import { Search } from 'lucide-react'
import type { ClothingItem, Category } from '../types'
import ItemCard from '../components/ItemCard'
import ItemDetail from '../components/ItemDetail'

interface Props {
  items: ClothingItem[]
  onToggleFav: (id: string) => void
  onDelete: (id: string) => void
  onLogWear: (id: string) => void
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

export default function ClosetPage({ items, onToggleFav, onDelete, onLogWear }: Props) {
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
      <div className="page-header">
        <h1>
          <span className="logo-mark">D</span> My Closet
        </h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {items.length} items
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search your wardrobe..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-bright)',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* Category filter */}
      <div className="chip-row" style={{ marginBottom: 16 }}>
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

      {/* Stats */}
      {items.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{items.length}</div>
            <div className="stat-label">Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{items.filter(i => i.favorite).length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {items.reduce((sum, i) => sum + i.timesWorn, 0)}
            </div>
            <div className="stat-label">Wears</div>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="item-grid">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleFav={onToggleFav}
              onClick={setSelected}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search />
          <h3>{items.length === 0 ? 'Your closet is empty' : 'No matches'}</h3>
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
            onDelete(id)
            setSelected(null)
          }}
          onLogWear={onLogWear}
        />
      )}
    </div>
  )
}
