import { useState, useRef, useEffect } from 'react'
import { Camera, Image as ImageIcon, Plus, Loader } from 'lucide-react'
import type { ClothingItem, Category, Season, Occasion } from '../types'
import { detectColors, getPrimaryColor, type DetectedColor } from '../utils/colorDetect'

interface Props {
  onAdd: (item: ClothingItem) => void
  onNavigate: (page: 'closet') => void
}

const CATEGORIES: Category[] = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories', 'activewear']
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'all']
const OCCASIONS: Occasion[] = ['casual', 'work', 'formal', 'athletic', 'night-out', 'date']

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function ScanPage({ onAdd, onNavigate }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('tops')
  const [seasons, setSeasons] = useState<Season[]>(['all'])
  const [occasions, setOccasions] = useState<Occasion[]>(['casual'])
  const [brand, setBrand] = useState('')
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([])
  const [detecting, setDetecting] = useState(false)

  // Auto-detect colors when image changes
  useEffect(() => {
    if (!imageUrl) {
      setDetectedColors([])
      return
    }
    setDetecting(true)
    detectColors(imageUrl).then(colors => {
      setDetectedColors(colors)
      setDetecting(false)
    })
  }, [imageUrl])

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

    const primary = getPrimaryColor(detectedColors)

    const item: ClothingItem = {
      id: uid(),
      name: name.trim(),
      category,
      color: primary.hex,
      colorName: detectedColors.map(c => c.name).join(', ') || primary.name,
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

      {/* Image upload — two separate buttons for iOS Safari */}
      {!imageUrl ? (
        <div className="upload-buttons">
          <button className="upload-btn" onClick={() => cameraRef.current?.click()}>
            <Camera />
            <span>Camera</span>
          </button>
          <button className="upload-btn" onClick={() => galleryRef.current?.click()}>
            <ImageIcon />
            <span>Gallery</span>
          </button>

          {/* Hidden inputs — separate for camera vs gallery */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      ) : (
        <div className="scan-zone" onClick={() => galleryRef.current?.click()}>
          <img className="scan-preview" src={imageUrl} alt="Preview" />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      )}

      {/* Detected colors */}
      {imageUrl && (
        <div style={{ marginTop: 14 }}>
          <div className="section-label">Detected Colors</div>
          {detecting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Analyzing colors...
            </div>
          ) : detectedColors.length > 0 ? (
            <div className="detected-colors">
              {detectedColors.map(c => (
                <div className="detected-color" key={c.name}>
                  <span className="color-dot" style={{ background: c.hex }} />
                  {c.name} ({c.percentage}%)
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Could not detect colors
            </p>
          )}
        </div>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
