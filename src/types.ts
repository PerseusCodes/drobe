export type Category =
  | 'tops'
  | 'bottoms'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'dresses'
  | 'activewear'

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all'

export type Occasion = 'casual' | 'work' | 'formal' | 'athletic' | 'night-out' | 'date'

export interface ClothingItem {
  id: string
  name: string
  category: Category
  color: string
  colorName: string
  season: Season[]
  occasions: Occasion[]
  imageUrl: string
  brand?: string
  dateAdded: string
  timesWorn: number
  lastWorn?: string
  favorite: boolean
}

export interface Outfit {
  id: string
  name: string
  items: string[] // item IDs
  occasion: Occasion
  season: Season
  createdAt: string
  timesWorn: number
  saved: boolean
}

export type Page = 'closet' | 'outfits' | 'scan' | 'declutter' | 'profile'
