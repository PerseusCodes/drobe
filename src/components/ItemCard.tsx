import type { ClothingItem } from '../types'

interface Props {
  item: ClothingItem
  onToggleFav: (id: string) => void
  onClick: (item: ClothingItem) => void
}

export default function ItemCard({ item, onToggleFav, onClick }: Props) {
  return (
    <div className="item-card" onClick={() => onClick(item)}>
      <div className="item-img-wrap">
        {item.imageUrl ? (
          <img className="item-img" src={item.imageUrl} alt={item.name} />
        ) : (
          <div className="img-placeholder">
            <span className="material-symbols-outlined">checkroom</span>
          </div>
        )}
        <button
          className={`fav-btn ${item.favorite ? 'is-fav' : ''}`}
          onClick={e => {
            e.stopPropagation()
            onToggleFav(item.id)
          }}
        >
          <span
            className="material-symbols-outlined"
            style={item.favorite ? { fontVariationSettings: "'FILL' 1, 'wght' 300" } : undefined}
          >
            favorite
          </span>
        </button>
      </div>
      <div className="item-info">
        <h3 className="item-name">{item.name}</h3>
        <div className="color-dot" style={{ background: item.color }} />
      </div>
    </div>
  )
}
