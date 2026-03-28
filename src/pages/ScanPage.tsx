import { useState, useRef, useEffect } from 'react'
import { Camera, Image as ImageIcon, Plus, Loader, Tag } from 'lucide-react'
import type { ClothingItem, Category, Season, Occasion, Fabric } from '../types'
import { detectColors, getPrimaryColor, type DetectedColor } from '../utils/colorDetect'
import { resizeImage } from '../utils/imageResize'
import { ALL_FABRICS } from '../utils/careInstructions'

interface Props {
  onAdd: (item: ClothingItem) => void
  onNavigate: (page: 'closet') => void
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'activewear', label: 'Activewear' },
]

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'all']
const OCCASIONS: Occasion[] = ['casual', 'work', 'formal', 'athletic', 'night-out', 'date']

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function buildSuggestedName(colors: DetectedColor[], category: Category): string {
  const colorPart = colors.length > 0 ? colors[0].name : ''
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? ''
  // Singularize the category label
  const singular = catLabel.endsWith('s') && catLabel !== 'Dress'
    ? catLabel.slice(0, -1)
    : catLabel === 'Dresses' ? 'Dress' : catLabel
  return colorPart ? `${colorPart} ${singular}` : singular
}

export default function ScanPage({ onAdd, onNavigate }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const labelCameraRef = useRef<HTMLInputElement>(null)
  const labelGalleryRef = useRef<HTMLInputElement>(null)

  const [imageUrl, setImageUrl] = useState('')
  const [labelImageUrl, setLabelImageUrl] = useState('')
  const [name, setName] = useState('')
  const [nameWasEdited, setNameWasEdited] = useState(false)
  const [category, setCategory] = useState<Category>('tops')
  const [seasons, setSeasons] = useState<Season[]>(['all'])
  const [occasions, setOccasions] = useState<Occasion[]>(['casual'])
  const [brand, setBrand] = useState('')
  const [fabrics, setFabrics] = useState<Fabric[]>([])
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

  // Auto-suggest name when colors or category change (unless user manually edited)
  useEffect(() => {
    if (!nameWasEdited) {
      setName(buildSuggestedName(detectedColors, category))
    }
  }, [detectedColors, category, nameWasEdited])

  const toggleSeason = (s: Season) => {
    if (s === 'all') { setSeasons(['all']); return }
    setSeasons(prev => {
      const without = prev.filter(x => x !== 'all')
      return without.includes(s) ? without.filter(x => x !== s) : [...without, s]
    })
  }

  const toggleOccasion = (o: Occasion) => {
    setOccasions(prev =>
      prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]
    )
  }

  const toggleFabric = (f: Fabric) => {
    setFabrics(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  const handleFile = (file: File, setter: (url: string) => void) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const raw = reader.result as string
      const compressed = await resizeImage(raw, 400)
      setter(compressed)
    }
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
      labelImageUrl: labelImageUrl || undefined,
      fabrics: fabrics.length ? fabrics : undefined,
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

      {/* Item photo */}
      <div className="section-label">Item Photo</div>
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
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file, setImageUrl)
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file, setImageUrl)
            }}
          />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <img
            src={imageUrl}
            alt="Item preview"
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            className="btn btn-ghost"
            style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(255,255,255,0.85)', borderRadius: 20, fontSize: '0.78rem' }}
            onClick={() => { setImageUrl(''); setDetectedColors([]) }}
          >
            Change
          </button>
        </div>
      )}

      {/* Detected colors */}
      {imageUrl && (
        <div style={{ marginTop: 12 }}>
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
            onChange={e => { setName(e.target.value); setNameWasEdited(true) }}
          />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="multi-chips">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
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

        {/* Fabric / Care Label section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={14} /> Fabric & Care
          </div>

          {/* Care label photo */}
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Snap the care label to save it, and select the fabric types.
          </p>

          {!labelImageUrl ? (
            <div className="upload-buttons" style={{ marginBottom: 14 }}>
              <button className="upload-btn" style={{ padding: '14px 12px' }} onClick={() => labelCameraRef.current?.click()}>
                <Camera size={22} />
                <span style={{ fontSize: '0.78rem' }}>Snap Label</span>
              </button>
              <button className="upload-btn" style={{ padding: '14px 12px' }} onClick={() => labelGalleryRef.current?.click()}>
                <ImageIcon size={22} />
                <span style={{ fontSize: '0.78rem' }}>From Gallery</span>
              </button>
              <input
                ref={labelCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file, setLabelImageUrl)
                }}
              />
              <input
                ref={labelGalleryRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file, setLabelImageUrl)
                }}
              />
            </div>
          ) : (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <img
                src={labelImageUrl}
                alt="Care label"
                style={{
                  width: '100%',
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              />
              <button
                className="btn btn-ghost"
                style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(255,255,255,0.85)', borderRadius: 20, fontSize: '0.75rem' }}
                onClick={() => setLabelImageUrl('')}
              >
                Remove
              </button>
            </div>
          )}

          {/* Fabric chips */}
          <div className="field">
            <label>Fabric Type</label>
            <div className="multi-chips">
              {ALL_FABRICS.map(f => (
                <button
                  key={f}
                  className={`chip ${fabrics.includes(f) ? 'active' : ''}`}
                  onClick={() => toggleFabric(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
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
