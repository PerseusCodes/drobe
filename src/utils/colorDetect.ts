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

  // Dark but saturated = the actual color, not black
  // (this is the key fix for dark green showing as black)
  if (l < 0.18 && s < 0.3) return { name: 'Black', hex: '#1A1A1A' }

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
      // Normal range
      if (h >= cat.hueMin && h < cat.hueMax) return { name: cat.name, hex: cat.hex }
    } else {
      // Wraps around 360 (Red: 345-360 and 0-15)
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
 * Uses HSL-based matching which is much more resilient to lighting conditions.
 * Skips extreme shadows and highlights to focus on actual garment color.
 */
export function detectColors(imageUrl: string): Promise<DetectedColor[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 100
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)

      // Sample center region (avoid background at edges)
      const margin = Math.floor(size * 0.18)
      const sampleW = size - margin * 2
      const sampleH = size - margin * 2
      const data = ctx.getImageData(margin, margin, sampleW, sampleH).data

      const counts: Record<string, { name: string; hex: string; count: number }> = {}
      let total = 0

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
        if (a < 128) continue

        // Skip extreme highlights and deep shadows — these are lighting artifacts
        const [, , l] = rgbToHsl(r, g, b)
        if (l < 0.05 || l > 0.97) continue

        const match = classifyPixel(r, g, b)
        if (!counts[match.name]) {
          counts[match.name] = { name: match.name, hex: match.hex, count: 0 }
        }
        counts[match.name].count++
        total++
      }

      if (total === 0) {
        resolve([])
        return
      }

      const results = Object.values(counts)
        .map(c => ({ name: c.name, hex: c.hex, percentage: Math.round((c.count / total) * 100) }))
        .filter(c => c.percentage >= 8)
        .sort((a, b) => b.percentage - a.percentage)
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
