/** General color categories — no need for dark green vs light green */
const COLOR_MAP: { name: string; hex: string; r: number; g: number; b: number }[] = [
  { name: 'Black', hex: '#1A1A1A', r: 26, g: 26, b: 26 },
  { name: 'White', hex: '#F5F5F5', r: 245, g: 245, b: 245 },
  { name: 'Grey', hex: '#808080', r: 128, g: 128, b: 128 },
  { name: 'Red', hex: '#DC2626', r: 220, g: 38, b: 38 },
  { name: 'Pink', hex: '#EC4899', r: 236, g: 72, b: 153 },
  { name: 'Orange', hex: '#F97316', r: 249, g: 115, b: 22 },
  { name: 'Yellow', hex: '#EAB308', r: 234, g: 179, b: 8 },
  { name: 'Green', hex: '#22C55E', r: 34, g: 197, b: 94 },
  { name: 'Teal', hex: '#14B8A6', r: 20, g: 184, b: 166 },
  { name: 'Blue', hex: '#3B82F6', r: 59, g: 130, b: 246 },
  { name: 'Navy', hex: '#1E3A5F', r: 30, g: 58, b: 95 },
  { name: 'Purple', hex: '#8B5CF6', r: 139, g: 92, b: 246 },
  { name: 'Brown', hex: '#92400E', r: 146, g: 64, b: 14 },
  { name: 'Beige', hex: '#D4B896', r: 212, g: 184, b: 150 },
]

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function nearestColor(r: number, g: number, b: number) {
  let best = COLOR_MAP[0]
  let bestDist = Infinity
  for (const c of COLOR_MAP) {
    const d = colorDistance(r, g, b, c.r, c.g, c.b)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best
}

export interface DetectedColor {
  name: string
  hex: string
  percentage: number
}

/**
 * Analyze an image and return the dominant general color categories.
 * Samples a grid of pixels, maps each to the nearest named color,
 * and returns colors making up at least 10% of the sampled area.
 */
export function detectColors(imageUrl: string): Promise<DetectedColor[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 100 // sample at 100x100 resolution
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)

      // Sample a center-weighted region (avoid background edges)
      const margin = Math.floor(size * 0.15)
      const sampleW = size - margin * 2
      const sampleH = size - margin * 2
      const data = ctx.getImageData(margin, margin, sampleW, sampleH).data

      const counts: Record<string, { name: string; hex: string; count: number }> = {}
      let total = 0

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
        if (a < 128) continue // skip transparent pixels

        const match = nearestColor(r, g, b)
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
