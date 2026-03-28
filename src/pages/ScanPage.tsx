import { useState, useRef } from 'react'
import { Camera, Upload, Plus, Image } from 'lucide-react'
import type { ClothingItem, Category, Season, Occasion } from '../types'

interface Props {
  onAdd: (item: ClothingItem) => void
  onNavigate: (page: 'closet') => void
}

const COLORS = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#F5F5F5' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Teal', hex: '#14B8A6' },
]

const CATEGORIES: Category[] = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories', 'activewear']
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'all']
const OCCASIONS: Occasion[] = ['casual', 'work', 'formal', 'athletic', 'night-out', 'date']

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function ScanPage({ onAdd, onNavigate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('tops')
  const [color, setColor] = useState(COLORS[0])
  const [seasons, setSeasons] = useState<Season[]>(['all'])
  const [occasions, setOccasions] = useState<Occasion[]>(['casual'])
  const [brand, setBrand] = useState('')

  const toggleSeason = (s: Season) => {
    if (s === 'all') {
      setSeasons(['all'])
      return
    }
    setSeasons(prev => {
      const without = prev.filter(x => x !== 'all')
      return without.includes(s)
        ? without.filter(x => x !== s)
        : [...without, s]
    })
  }

  const toggleOccasion = (o: Occasion) => {
    setOccasions(prev =>
      prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]
    )
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!name.trim()) return

    const item: ClothingItem = {
      id: uid(),
      name: name.trim(),
      category,
      color: color.hex,
      colorName: color.name,
      season: seasons.length ? seasons : ['all'],
      occasions: occasions.length ? occasions : ['casual'],
      imageUrl,
      brand: brand.trim() || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      timesWorn: 0,
      favorite: false,
    }

    onAdd(item)
    onNavigate('closet')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <Plus size={24} style={{ color: 'var(--accent)' }} /> Add Item
        </h1>
      </div>

      {/* Image upload zone */}
      <div
        className="scan-zone"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          e.currentTarget.classList.add('dragover')
        }}
        onDragLeave={e => e.currentTarget.classList.remove('dragover')}
        onDrop={e => {
          e.preventDefault()
          e.currentTarget.classList.remove('dragover')
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {imageUrl ? (
          <img className="scan-preview" src={imageUrl} alt="Preview" />
        ) : (
          <>
            <Camera />
            <p>Tap to take a photo or upload</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="chip">
                <Camera size={14} /> Camera
              </span>
              <span className="chip">
                <Upload size={14} /> Gallery
              </span>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {/* Quick add without photo */}
      {!imageUrl && (
        <button
          className="btn btn-ghost btn-full"
          style={{ marginTop: 8, fontSize: '0.82rem' }}
          onClick={() => {}}
        >
          <Image size={16} /> Continue without photo
        </button>
      )}

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            placeholder="e.g. Black Nike Hoodie"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as Category)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Color</label>
          <div className="color-grid">
            {COLORS.map(c => (
              <div
                key={c.hex}
                className={`color-swatch ${color.hex === c.hex ? 'selected' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setColor(c)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Seasons</label>
          <div className="multi-chips">
            {SEASONS.map(s => (
              <button
                key={s}
                className={`chip ${seasons.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSeason(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Occasions</label>
          <div className="multi-chips">
            {OCCASIONS.map(o => (
              <button
                key={o}
                className={`chip ${occasions.includes(o) ? 'active' : ''}`}
                onClick={() => toggleOccasion(o)}
              >
                {o.charAt(0).toUpperCase() + o.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Brand (optional)</label>
          <input
            type="text"
            placeholder="e.g. Nike, Zara"
            value={brand}
            onChange={e => setBrand(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{ opacity: name.trim() ? 1 : 0.5, marginBottom: 8 }}
        >
          <Plus size={18} /> Add to Closet
        </button>
      </div>
    </div>
  )
}
