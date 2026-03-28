import type { Fabric } from '../types'

interface CareInfo {
  wash: string
  dry: string
  iron: string
  tips: string
}

const CARE_MAP: Record<Fabric, CareInfo> = {
  cotton: {
    wash: 'Machine wash warm or cold. Tumble dry low.',
    dry: 'Tumble dry low or hang dry to prevent shrinking.',
    iron: 'Iron on medium-high heat. Steam works well.',
    tips: 'Pre-wash dark colors separately. Gets softer with each wash.',
  },
  polyester: {
    wash: 'Machine wash cold or warm. Gentle cycle recommended.',
    dry: 'Tumble dry low. Remove promptly to reduce wrinkles.',
    iron: 'Low heat only — can melt. Use a pressing cloth.',
    tips: 'Resistant to wrinkles and shrinking. Holds color well.',
  },
  nylon: {
    wash: 'Machine wash cold on gentle cycle.',
    dry: 'Hang dry or tumble dry on no heat.',
    iron: 'Low heat if needed. Nylon melts easily.',
    tips: 'Quick-drying. Avoid direct sunlight for long periods.',
  },
  wool: {
    wash: 'Hand wash cold or dry clean. Use wool-specific detergent.',
    dry: 'Lay flat to dry — never hang (stretches). Never tumble dry.',
    iron: 'Steam or press with a cloth on low heat.',
    tips: 'Store folded, not hung. Use cedar to prevent moths.',
  },
  silk: {
    wash: 'Hand wash cold with gentle detergent, or dry clean.',
    dry: 'Lay flat on a towel. Never wring or tumble dry.',
    iron: 'Low heat on the reverse side while slightly damp.',
    tips: 'Avoid perfume/deodorant contact. Store away from sunlight.',
  },
  linen: {
    wash: 'Machine wash cold or warm on gentle. Use mild detergent.',
    dry: 'Hang dry is best. Tumble dry low if needed.',
    iron: 'Iron while damp on medium-high heat for best results.',
    tips: 'Wrinkles are natural and part of the look. Softens over time.',
  },
  denim: {
    wash: 'Wash inside out in cold water. Wash less frequently.',
    dry: 'Hang dry to maintain shape and prevent fading.',
    iron: 'Medium-high heat if needed.',
    tips: 'Spot clean when possible. Freeze overnight to kill bacteria between washes.',
  },
  leather: {
    wash: 'Wipe with a damp cloth. Use leather cleaner for deeper clean.',
    dry: 'Air dry naturally. Never use heat or direct sunlight.',
    iron: 'Do not iron.',
    tips: 'Condition every few months to prevent cracking. Store on padded hangers.',
  },
  cashmere: {
    wash: 'Hand wash cold with cashmere/wool detergent. Never machine wash.',
    dry: 'Lay flat to dry on a clean towel. Reshape while damp.',
    iron: 'Steam gently or low heat with a pressing cloth.',
    tips: 'Fold to store — never hang. Use a cashmere comb for pilling.',
  },
  rayon: {
    wash: 'Hand wash cold or dry clean. Shrinks easily.',
    dry: 'Hang dry or lay flat. Never tumble dry.',
    iron: 'Low to medium heat on the reverse side.',
    tips: 'Very delicate when wet. Handle gently during washing.',
  },
  spandex: {
    wash: 'Hand wash or machine wash cold on gentle cycle.',
    dry: 'Hang dry. Heat damages elasticity.',
    iron: 'Do not iron.',
    tips: 'Avoid fabric softener — it breaks down the fibers.',
  },
  fleece: {
    wash: 'Machine wash cold inside out. No fabric softener.',
    dry: 'Tumble dry low or hang dry.',
    iron: 'Do not iron — will melt.',
    tips: 'Wash with similar fabrics. Avoid velcro contact (causes pilling).',
  },
  velvet: {
    wash: 'Dry clean recommended. Spot clean with a damp cloth.',
    dry: 'Air dry. Never wring.',
    iron: 'Steam from the back side only. Never press directly.',
    tips: 'Hang on padded hangers. Brush gently to restore pile.',
  },
  satin: {
    wash: 'Hand wash cold or dry clean.',
    dry: 'Hang dry away from direct heat.',
    iron: 'Low heat on the reverse side.',
    tips: 'Handle carefully — satin snags easily on rough surfaces.',
  },
}

export function getCareInstructions(fabrics: Fabric[]): CareInfo[] {
  return fabrics.map(f => ({ fabric: f, ...CARE_MAP[f] })).map(c => ({
    wash: c.wash,
    dry: c.dry,
    iron: c.iron,
    tips: c.tips,
  }))
}

export function getCombinedCare(fabrics: Fabric[]): CareInfo {
  if (fabrics.length === 0) return {
    wash: 'Check care label',
    dry: 'Check care label',
    iron: 'Check care label',
    tips: 'Add fabric types to see care instructions',
  }

  // Use the most delicate care instructions
  const all = fabrics.map(f => CARE_MAP[f])

  // For combined, pick the gentlest approach
  const hasDelicate = fabrics.some(f =>
    ['silk', 'cashmere', 'wool', 'velvet', 'rayon', 'leather'].includes(f)
  )
  const hasHeatSensitive = fabrics.some(f =>
    ['polyester', 'nylon', 'spandex', 'fleece', 'satin'].includes(f)
  )

  return {
    wash: hasDelicate
      ? 'Hand wash cold or dry clean (delicate fabrics present).'
      : all[0].wash,
    dry: hasDelicate
      ? 'Lay flat to dry or hang dry. Avoid tumble dryer.'
      : all[0].dry,
    iron: hasHeatSensitive
      ? 'Low heat only or steam. Test on an inside seam first.'
      : all[0].iron,
    tips: all.map(c => c.tips).join(' '),
  }
}

export const ALL_FABRICS: Fabric[] = [
  'cotton', 'polyester', 'nylon', 'wool', 'silk', 'linen',
  'denim', 'leather', 'cashmere', 'rayon', 'spandex', 'fleece',
  'velvet', 'satin',
]
