import type { ClothingItem, Occasion, Season, Outfit } from '../types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function colorCompatible(a: string, b: string): boolean {
  // Neutrals go with everything
  const neutrals = ['#000000', '#FFFFFF', '#808080', '#F5F5DC', '#000080', '#D2B48C', '#FFFFF0']
  const isNeutral = (c: string) =>
    neutrals.some(n => n.toLowerCase() === c.toLowerCase()) ||
    ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'tan', 'cream', 'khaki', 'brown']
      .includes(c.toLowerCase())

  if (isNeutral(a) || isNeutral(b)) return true
  // Different colors are generally fine for variety
  return a.toLowerCase() !== b.toLowerCase()
}

function seasonMatch(itemSeasons: Season[], target: Season): boolean {
  return itemSeasons.includes('all') || itemSeasons.includes(target)
}

export function generateOutfits(
  items: ClothingItem[],
  occasion: Occasion | 'any',
  season: Season | 'any',
  limit = 10
): Outfit[] {
  const tops = items.filter(i => i.category === 'tops' || i.category === 'dresses')
  const bottoms = items.filter(i => i.category === 'bottoms')
  const shoes = items.filter(i => i.category === 'shoes')
  const outerwear = items.filter(i => i.category === 'outerwear')
  const dresses = items.filter(i => i.category === 'dresses')

  const outfits: Outfit[] = []

  // Dress-based outfits
  for (const dress of dresses) {
    if (occasion !== 'any' && !dress.occasions.includes(occasion)) continue
    if (season !== 'any' && !seasonMatch(dress.season, season)) continue

    for (const shoe of shoes) {
      if (occasion !== 'any' && !shoe.occasions.includes(occasion)) continue
      if (season !== 'any' && !seasonMatch(shoe.season, season)) continue
      if (!colorCompatible(dress.color, shoe.color)) continue

      const outfitItems = [dress.id, shoe.id]

      // Optionally add outerwear for colder seasons
      if (season === 'fall' || season === 'winter') {
        const jacket = outerwear.find(
          o =>
            (occasion === 'any' || o.occasions.includes(occasion)) &&
            seasonMatch(o.season, season as Season) &&
            colorCompatible(dress.color, o.color)
        )
        if (jacket) outfitItems.push(jacket.id)
      }

      outfits.push({
        id: uid(),
        name: `${dress.name} + ${shoe.name}`,
        items: outfitItems,
        occasion: occasion === 'any' ? dress.occasions[0] : occasion,
        season: season === 'any' ? dress.season[0] : season,
        createdAt: new Date().toISOString(),
        timesWorn: 0,
        saved: false,
      })

      if (outfits.length >= limit) return outfits
    }
  }

  // Top + bottom combos
  const nonDressTops = tops.filter(t => t.category === 'tops')
  for (const top of nonDressTops) {
    if (occasion !== 'any' && !top.occasions.includes(occasion)) continue
    if (season !== 'any' && !seasonMatch(top.season, season)) continue

    for (const bottom of bottoms) {
      if (occasion !== 'any' && !bottom.occasions.includes(occasion)) continue
      if (season !== 'any' && !seasonMatch(bottom.season, season)) continue
      if (!colorCompatible(top.color, bottom.color)) continue

      for (const shoe of shoes.length > 0 ? shoes : [null]) {
        if (shoe && occasion !== 'any' && !shoe.occasions.includes(occasion)) continue
        if (shoe && season !== 'any' && !seasonMatch(shoe.season, season)) continue

        const outfitItems = [top.id, bottom.id]
        if (shoe) outfitItems.push(shoe.id)

        // Outerwear for cold seasons
        if (season === 'fall' || season === 'winter') {
          const jacket = outerwear.find(
            o =>
              (occasion === 'any' || o.occasions.includes(occasion)) &&
              seasonMatch(o.season, season as Season) &&
              colorCompatible(top.color, o.color)
          )
          if (jacket) outfitItems.push(jacket.id)
        }

        const name = shoe
          ? `${top.name} + ${bottom.name} + ${shoe.name}`
          : `${top.name} + ${bottom.name}`

        outfits.push({
          id: uid(),
          name,
          items: outfitItems,
          occasion: occasion === 'any' ? top.occasions[0] : occasion,
          season: season === 'any' ? top.season[0] : season,
          createdAt: new Date().toISOString(),
          timesWorn: 0,
          saved: false,
        })

        if (outfits.length >= limit) return outfits
      }
    }
  }

  return outfits
}

/** Items that don't appear in any generated outfit */
export function findDeclutterCandidates(
  items: ClothingItem[],
  allOutfits: Outfit[]
): ClothingItem[] {
  const usedIds = new Set(allOutfits.flatMap(o => o.items))
  const neverWorn = items.filter(i => i.timesWorn === 0 && !usedIds.has(i.id))
  const unused = items.filter(
    i => !usedIds.has(i.id) && !neverWorn.includes(i)
  )
  return [...neverWorn, ...unused]
}

/** Identify missing categories that would unlock more outfits */
export function findWardrobeGaps(items: ClothingItem[]): string[] {
  const gaps: string[] = []
  const cats = new Set(items.map(i => i.category))

  if (!cats.has('tops') && !cats.has('dresses'))
    gaps.push('Add some tops or dresses to build outfits')
  if (!cats.has('bottoms') && !cats.has('dresses'))
    gaps.push('Add bottoms (jeans, trousers, skirts) to pair with your tops')
  if (!cats.has('shoes')) gaps.push('Add shoes to complete your outfits')
  if (!cats.has('outerwear'))
    gaps.push('Add a jacket or coat for layered cold-weather looks')

  const occasions = new Set(items.flatMap(i => i.occasions))
  if (!occasions.has('formal'))
    gaps.push('No formal pieces — consider adding something for dressy occasions')
  if (!occasions.has('athletic'))
    gaps.push('No activewear — add items if you want workout outfit suggestions')

  return gaps
}
