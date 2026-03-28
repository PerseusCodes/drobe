/** General color categories — uses HSL matching for lighting resilience */

const COLOR_CATEGORIES = [
  { name: 'Red',    hex: '#DC2626', hueMin: 345, hueMax: 15 },
  { name: 'Orange', hex: '#F97316', hueMin: 15,  hueMax: 40 },
  { name: 'Yellow', hex: '#EAB308', hueMin: 40,  hueMax: 65 },
  { name: 'Green',  hex: '#22C55E', hueMin: 65,  hueMax: 170 },
  { name: 'Teal',   hex: '#14B8A6', hueMin: 170, hueMax: 195 },
  { name: 'Blue',   hex: '#3B82F6', hueMin: 195, hueMax: 255 },
  { name: 'Purple', hex: '#8B5CF6', hueMin: 255, hueMax: 290 },
  { name: 'Pink',   hex: '#EC4899', hueMin: 290, hueMax: 345 },
]

const ACHROMATIC = new Set(['Black', 'White', 'Grey'])

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60

  return [h, s, l]
}

function classifyPixel(r: number, g: number, b: number): { name: string; hex: string } {
  const [h, s, l] = rgbToHsl(r, g, b)

  // Achromatic colors — classify by lightness, not hue
  if (s < 0.12) {
    if (l < 0.25) return { name: 'Black', hex: '#1A1A1A' }
    if (l < 0.7)  return { name: 'Grey',  hex: '#808080' }
    return { name: 'White', hex: '#F5F5F5' }
  }

  // Low saturation + warm hue = likely beige/brown/tan
  if (s < 0.25 && l > 0.35 && l < 0.75) {
    if (h >= 15 && h < 50) return { name: 'Beige', hex: '#D4B896' }
  }

  // Very dark + low saturation = black (not a color)
  if (l < 0.15 && s < 0.25) return { name: 'Black', hex: '#1A1A1A' }

  // Brown: warm hue + dark + moderate saturation
  if (h >= 10 && h < 45 && l < 0.35 && s >= 0.2) {
    return { name: 'Brown', hex: '#92400E' }
  }

  // Navy: blue hue + very dark
  if (h >= 195 && h < 255 && l < 0.25) {
    return { name: 'Navy', hex: '#1E3A5F' }
  }

  // Match by hue to color categories
  for (const cat of COLOR_CATEGORIES) {
    if (cat.hueMin < cat.hueMax) {
      if (h >= cat.hueMin && h < cat.hueMax) return { name: cat.name, hex: cat.hex }
    } else {
      if (h >= cat.hueMin || h < cat.hueMax) return { name: cat.name, hex: cat.hex }
    }
  }

  return { name: 'Grey', hex: '#808080' }
}

export interface DetectedColor {
  name: string
  hex: string
  percentage: number
}

/**
 * Analyze an image and return dominant color categories.
 *
 * Strategy:
 * 1. Sample only the center 30% of the image (the garment, not the background)
 * 2. Use center-weighted sampling — pixels near the center count more
 * 3. If chromatic colors are found, deprioritize achromatic ones
 *    (achromatic is likely the background surface, not the garment)
 */
export function detectColors(imageUrl: string): Promise<DetectedColor[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 120
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)

      // Tight center crop — 30% margin on each side → sample the middle 40%
      const margin = Math.floor(size * 0.30)
      const sampleW = size - margin * 2
      const sampleH = size - margin * 2
      const centerX = size / 2
      const centerY = size / 2
      const maxDist = Math.sqrt(sampleW * sampleW + sampleH * sampleH) / 2

      const data = ctx.getImageData(margin, margin, sampleW, sampleH).data

      const counts: Record<string, { name: string; hex: string; weight: number }> = {}
      let totalWeight = 0

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const i = (y * sampleW + x) * 4
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 128) continue

          const [, , l] = rgbToHsl(r, g, b)
          if (l < 0.04 || l > 0.97) continue

          // Center-weighted: pixels near center count 2x more than edges
          const px = margin + x
          const py = margin + y
          const dist = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2)
          const weight = 1 + (1 - dist / maxDist)

          const match = classifyPixel(r, g, b)
          if (!counts[match.name]) {
            counts[match.name] = { name: match.name, hex: match.hex, weight: 0 }
          }
          counts[match.name].weight += weight
          totalWeight += weight
        }
      }

      if (totalWeight === 0) {
        resolve([])
        return
      }

      let results = Object.values(counts)
        .map(c => ({ name: c.name, hex: c.hex, percentage: Math.round((c.weight / totalWeight) * 100) }))
        .sort((a, b) => b.percentage - a.percentage)

      // Key insight: if we have ANY chromatic (actual) colors,
      // they're likely the garment — achromatic colors are likely the background.
      // Boost chromatic colors and reduce achromatic ones.
      const hasChromatic = results.some(c => !ACHROMATIC.has(c.name) && c.percentage >= 5)
      if (hasChromatic) {
        results = results.map(c => {
          if (ACHROMATIC.has(c.name)) {
            // Halve the weight of achromatic colors (likely background)
            return { ...c, percentage: Math.round(c.percentage * 0.4) }
          }
          return c
        })

        // Re-normalize percentages
        const total = results.reduce((s, c) => s + c.percentage, 0)
        if (total > 0) {
          results = results.map(c => ({ ...c, percentage: Math.round((c.percentage / total) * 100) }))
        }

        // Re-sort after adjustment
        results.sort((a, b) => b.percentage - a.percentage)
      }

      results = results
        .filter(c => c.percentage >= 5)
        .slice(0, 4)

      resolve(results)
    }

    img.onerror = () => resolve([])
    img.src = imageUrl
  })
}

/** Get the primary (most dominant) color info */
export function getPrimaryColor(colors: DetectedColor[]): { hex: string; name: string } {
  if (colors.length === 0) return { hex: '#808080', name: 'Grey' }
  return { hex: colors[0].hex, name: colors[0].name }
}
