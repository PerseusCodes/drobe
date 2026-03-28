import { Heart, Shirt } from 'lucide-react'
import type { ClothingItem } from '../types'

interface Props {
  item: ClothingItem
  onToggleFav: (id: string) => void
  onClick: (item: ClothingItem) => void
}

export default function ItemCard({ item, onToggleFav, onClick }: Props) {
  return (
    <div className="card item-card" onClick={() => onClick(item)}>
      {item.imageUrl ? (
        <img className="item-img" src={item.imageUrl} alt={item.name} />
      ) : (
        <div className="img-placeholder">
          <Shirt />
        </div>
      )}
      <button
        className={`fav-btn ${item.favorite ? 'is-fav' : ''}`}
        onClick={e => {
          e.stopPropagation()
          onToggleFav(item.id)
        }}
      >
        <Heart />
      </button>
      <div className="item-info">
        <div className="item-name">{item.name}</div>
        <div className="item-meta">
          <span className="color-dot" style={{ background: item.color }} />
          <span>{item.timesWorn}x worn</span>
        </div>
      </div>
    </div>
  )
}
