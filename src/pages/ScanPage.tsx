import { useState, useRef, useEffect, useCallback } from 'react'
import type { Category, Season, Occasion, Fabric } from '../types'
import { detectColors, getPrimaryColor, type DetectedColor } from '../utils/colorDetect'
import { resizeImage } from '../utils/imageResize'
import { ALL_FABRICS } from '../utils/careInstructions'
import { scanLabel } from '../utils/labelOcr'
import { useAddGarment } from '../hooks/useGarments'
import { removeBackground } from '../utils/removeBackground'

interface Props {
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

function buildSuggestedName(colors: DetectedColor[], category: Category): string {
  const colorPart = colors.length > 0 ? colors[0].name : ''
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? ''
  const singular = catLabel.endsWith('s') && catLabel !== 'Dress'
    ? catLabel.slice(0, -1)
    : catLabel === 'Dresses' ? 'Dress' : catLabel
  return colorPart ? `${colorPart} ${singular}` : singular
}

export default function ScanPage({ onNavigate }: Props) {
  const addGarment = useAddGarment()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const labelCameraRef = useRef<HTMLInputElement>(null)
  const labelGalleryRef = useRef<HTMLInputElement>(null)

  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [labelImageUrl, setLabelImageUrl] = useState('')
  const [labelImageFile, setLabelImageFile] = useState<File | undefined>(undefined)
  const [name, setName] = useState('')
  const [nameWasEdited, setNameWasEdited] = useState(false)
  const [category, setCategory] = useState<Category>('tops')
  const [seasons, setSeasons] = useState<Season[]>(['all'])
  const [occasions, setOccasions] = useState<Occasion[]>(['casual'])
  const [brand, setBrand] = useState('')
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([])
  const [detecting, setDetecting] = useState(false)
  const [scanningLabel, setScanningLabel] = useState(false)
  const [labelOcrText, setLabelOcrText] = useState('')
  const [removingBg, setRemovingBg] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState('')
  const bgRemovalCancelledRef = useRef(false)

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

  const handleFile = useCallback((file: File) => {
    // Reset cancel flag for this new run
    bgRemovalCancelledRef.current = false

    const reader = new FileReader()
    reader.onload = async () => {
      const raw = reader.result as string
      const compressed = await resizeImage(raw, 400)

      // Store original first so Skip is available immediately
      setOriginalImageUrl(compressed)
      setImageFile(file)
      setImageUrl(compressed)

      // Kick off background removal non-blocking
      setRemovingBg(true)
      try {
        const processed = await removeBackground(compressed)
        // Bail out if the user clicked Skip while we were processing
        if (bgRemovalCancelledRef.current) return
        // Convert result data URL back to a File for Supabase upload
        const res = await fetch(processed)
        const blob = await res.blob()
        const processedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
        setImageUrl(processed)
        setImageFile(processedFile)
      } catch {
        console.warn('Background removal failed — keeping original')
        // imageUrl and imageFile already set to original above; nothing to do
      } finally {
        if (!bgRemovalCancelledRef.current) setRemovingBg(false)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleLabelFile = (file: File) => {
    setLabelImageFile(file)
    const reader = new FileReader()
    reader.onload = async () => {
      const raw = reader.result as string
      const compressed = await resizeImage(raw, 600)
      setLabelImageUrl(compressed)

      setScanningLabel(true)
      setLabelOcrText('')
      try {
        const result = await scanLabel(compressed)
        if (result.fabrics.length > 0) {
          setFabrics(prev => {
            const combined = new Set([...prev, ...result.fabrics])
            return Array.from(combined)
          })
        }
        setLabelOcrText(result.rawText)
      } catch {
        console.warn('Label OCR failed')
      } finally {
        setScanningLabel(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!name.trim()) return

    const primary = getPrimaryColor(detectedColors)

    addGarment.mutate(
      {
        name: name.trim(),
        category,
        color: primary.hex,
        colorName: detectedColors.map(c => c.name).join(', ') || primary.name,
        season: seasons.length ? seasons : ['all'],
        occasions: occasions.length ? occasions : ['casual'],
        imageFile,
        labelImageFile,
        fabrics: fabrics.length ? fabrics : undefined,
        brand: brand.trim() || undefined,
      },
      { onSuccess: () => onNavigate('closet') }
    )
  }

  const step = !imageUrl ? 1 : 2

  return (
    <div className="page">
      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        <div style={{
          width: 48,
          height: 3,
          borderRadius: 2,
          background: 'var(--accent)',
        }} />
        <div style={{
          width: 48,
          height: 3,
          borderRadius: 2,
          background: step >= 2 ? 'var(--accent)' : 'rgba(216, 194, 184, 0.4)',
        }} />
      </div>

      {/* Instruction */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          padding: '10px 20px',
          borderRadius: 9999,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Step {step}:</span>
            {step === 1 ? ' Capture the full garment' : ' Fill in the details'}
          </p>
        </div>
      </div>

      {/* Item photo */}
      {!imageUrl ? (
        <div style={{
          position: 'relative',
          aspectRatio: '3/4',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Scanner corners */}
          <div style={{
            position: 'absolute',
            inset: 40,
            background: `
              linear-gradient(to right, var(--accent) 2px, transparent 2px) 0 0,
              linear-gradient(to right, var(--accent) 2px, transparent 2px) 0 100%,
              linear-gradient(to left, var(--accent) 2px, transparent 2px) 100% 0,
              linear-gradient(to left, var(--accent) 2px, transparent 2px) 100% 100%,
              linear-gradient(to bottom, var(--accent) 2px, transparent 2px) 0 0,
              linear-gradient(to bottom, var(--accent) 2px, transparent 2px) 100% 0,
              linear-gradient(to top, var(--accent) 2px, transparent 2px) 0 100%,
              linear-gradient(to top, var(--accent) 2px, transparent 2px) 100% 100%
            `,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '24px 24px',
            opacity: 0.6,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--accent)', opacity: 0.5 }}>
              photo_camera
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ padding: '12px 20px', fontSize: '0.8rem' }} onClick={() => cameraRef.current?.click()}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span> Camera
              </button>
              <button className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '0.8rem' }} onClick={() => galleryRef.current?.click()}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>image</span> Gallery
              </button>
            </div>
          </div>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {removingBg ? (
              <>
                <div
                  className="skeleton"
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: 'var(--radius)',
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Removing background…
                  </p>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                    onClick={() => {
                      bgRemovalCancelledRef.current = true
                      setRemovingBg(false)
                      // imageUrl and imageFile already hold the original
                    }}
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={imageUrl}
                  alt="Item preview"
                  style={{
                    width: '100%',
                    height: 220,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  display: 'flex',
                  gap: 6,
                }}>
                  {originalImageUrl && imageUrl !== originalImageUrl && (
                    <button
                      className="btn btn-ghost"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        borderRadius: 9999,
                        fontSize: '0.78rem',
                        backdropFilter: 'blur(8px)',
                      }}
                      onClick={async () => {
                        setImageUrl(originalImageUrl)
                        const res = await fetch(originalImageUrl)
                        const blob = await res.blob()
                        const originalFile = new File([blob], 'garment.jpg', { type: 'image/jpeg' })
                        setImageFile(originalFile)
                      }}
                    >
                      Skip BG
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      borderRadius: 9999,
                      fontSize: '0.78rem',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={() => {
                      setImageUrl('')
                      setImageFile(undefined)
                      setOriginalImageUrl('')
                      setDetectedColors([])
                    }}
                  >
                    Change
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Detected colors */}
          <div style={{ marginBottom: 16 }}>
            {detecting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>
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

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

            {/* Fabric & Care Label */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>label</span> Fabric & Care
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Snap the care label — fabrics will be detected automatically.
              </p>

              {!labelImageUrl ? (
                <div className="upload-buttons" style={{ marginBottom: 14 }}>
                  <button className="upload-btn" style={{ padding: '14px 12px' }} onClick={() => labelCameraRef.current?.click()}>
                    <span className="material-symbols-outlined">photo_camera</span>
                    <span style={{ fontSize: '0.78rem' }}>Snap Label</span>
                  </button>
                  <button className="upload-btn" style={{ padding: '14px 12px' }} onClick={() => labelGalleryRef.current?.click()}>
                    <span className="material-symbols-outlined">image</span>
                    <span style={{ fontSize: '0.78rem' }}>From Gallery</span>
                  </button>
                  <input ref={labelCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLabelFile(f) }} />
                  <input ref={labelGalleryRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLabelFile(f) }} />
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={labelImageUrl}
                      alt="Care label"
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    />
                    <button
                      className="btn btn-ghost"
                      style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(255,255,255,0.85)', borderRadius: 9999, fontSize: '0.75rem' }}
                      onClick={() => { setLabelImageUrl(''); setLabelImageFile(undefined); setLabelOcrText('') }}
                    >
                      Remove
                    </button>
                  </div>

                  {scanningLabel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                      Reading label...
                    </div>
                  ) : labelOcrText ? (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.82rem', color: 'var(--success)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>check_circle</span>
                      <span>
                        {fabrics.length > 0
                          ? `Detected: ${fabrics.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}`
                          : 'No fabrics recognized — select manually below'}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

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
              disabled={!name.trim() || addGarment.isPending}
              style={{ opacity: (name.trim() && !addGarment.isPending) ? 1 : 0.5, marginBottom: 8, height: 52 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {addGarment.isPending ? 'progress_activity' : 'add_circle'}
              </span>
              {addGarment.isPending ? 'Saving...' : 'Add to Closet'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
