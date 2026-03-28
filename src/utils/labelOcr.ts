import { createWorker } from 'tesseract.js'
import type { Fabric } from '../types'
import { ALL_FABRICS } from './careInstructions'

/**
 * Map of common label text variations to our Fabric type.
 * Covers abbreviations, alternate spellings, and common OCR misreads.
 */
const FABRIC_ALIASES: Record<string, Fabric> = {
  cotton: 'cotton',
  coton: 'cotton',         // French
  algodón: 'cotton',       // Spanish
  baumwolle: 'cotton',     // German
  polyester: 'polyester',
  poliéster: 'polyester',
  poly: 'polyester',
  nylon: 'nylon',
  polyamide: 'nylon',
  wool: 'wool',
  laine: 'wool',           // French
  wolle: 'wool',           // German
  merino: 'wool',
  silk: 'silk',
  soie: 'silk',            // French
  linen: 'linen',
  lin: 'linen',            // French
  denim: 'denim',
  leather: 'leather',
  cuir: 'leather',         // French
  cashmere: 'cashmere',
  cachemire: 'cashmere',   // French
  rayon: 'rayon',
  viscose: 'rayon',
  viscosa: 'rayon',
  modal: 'rayon',
  spandex: 'spandex',
  elastane: 'spandex',
  élasthanne: 'spandex',   // French
  lycra: 'spandex',
  fleece: 'fleece',
  velvet: 'velvet',
  velours: 'velvet',       // French
  satin: 'satin',
  acrylic: 'polyester',    // close enough
  acrylique: 'polyester',
}

export interface LabelResult {
  fabrics: Fabric[]
  rawText: string
}

/**
 * Run OCR on a care label image and extract fabric types.
 * Returns detected fabrics and the raw OCR text.
 */
export async function scanLabel(imageUrl: string): Promise<LabelResult> {
  const worker = await createWorker('eng')

  try {
    const { data } = await worker.recognize(imageUrl)
    const rawText = data.text

    // Normalize: lowercase, strip special chars except %
    const normalized = rawText.toLowerCase().replace(/[^a-z0-9%\s]/g, ' ')

    // Find all fabric matches
    const found = new Set<Fabric>()

    for (const [alias, fabric] of Object.entries(FABRIC_ALIASES)) {
      // Match as whole word (with possible % number before it)
      const pattern = new RegExp(`(?:^|\\s|\\d)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|\\d)`, 'i')
      if (pattern.test(` ${normalized} `)) {
        found.add(fabric)
      }
    }

    // Also do a simpler check — just see if the fabric name appears anywhere
    for (const fabric of ALL_FABRICS) {
      if (normalized.includes(fabric)) {
        found.add(fabric)
      }
    }

    return {
      fabrics: Array.from(found),
      rawText: rawText.trim(),
    }
  } finally {
    await worker.terminate()
  }
}
