import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Occasion, Outfit, Season } from '../types'

// ---------------------------------------------------------------------------
// Types for DB rows
// ---------------------------------------------------------------------------

interface OutfitRow {
  id: string
  user_id: string
  name: string
  occasion: string
  season: string
  created_at: string
  times_worn: number
  saved: boolean
  is_public: boolean
}

interface OutfitItemRow {
  outfit_id: string
  garment_id: string
}

export interface SaveOutfitInput {
  name: string
  occasion: Occasion
  season: Season
  itemIds: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapOutfit(row: OutfitRow, itemIds: string[]): Outfit {
  return {
    id: row.id,
    name: row.name,
    items: itemIds,
    occasion: row.occasion as Occasion,
    season: row.season as Season,
    createdAt: row.created_at,
    timesWorn: row.times_worn,
    saved: row.saved,
  }
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const OUTFITS_KEY = (userId: string) => ['outfits', userId] as const

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useOutfits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: OUTFITS_KEY(user?.id ?? ''),
    enabled: !!user,
    queryFn: async (): Promise<Outfit[]> => {
      // Fetch outfits and their junction rows in parallel
      const [outfitsResult, itemsResult] = await Promise.all([
        supabase
          .from('outfits')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('outfit_items')
          .select('outfit_id, garment_id'),
      ])

      if (outfitsResult.error) throw new Error(outfitsResult.error.message)
      if (itemsResult.error) throw new Error(itemsResult.error.message)

      const outfitRows = (outfitsResult.data ?? []) as OutfitRow[]
      const junctionRows = (itemsResult.data ?? []) as OutfitItemRow[]

      // Build a map: outfitId -> garmentIds[]
      const itemMap = new Map<string, string[]>()
      for (const jr of junctionRows) {
        const existing = itemMap.get(jr.outfit_id) ?? []
        existing.push(jr.garment_id)
        itemMap.set(jr.outfit_id, existing)
      }

      return outfitRows.map(row => mapOutfit(row, itemMap.get(row.id) ?? []))
    },
  })
}

export function useSaveOutfit() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveOutfitInput): Promise<Outfit> => {
      if (!user) throw new Error('Not authenticated')

      // Insert the outfit row
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: input.name,
          occasion: input.occasion,
          season: input.season,
        })
        .select('*')
        .single()

      if (outfitError) throw new Error(outfitError.message)

      const outfitRow = outfitData as OutfitRow

      // Insert junction rows if there are items
      if (input.itemIds.length > 0) {
        const junctionRows = input.itemIds.map(garmentId => ({
          outfit_id: outfitRow.id,
          garment_id: garmentId,
        }))

        const { error: junctionError } = await supabase
          .from('outfit_items')
          .insert(junctionRows)

        if (junctionError) throw new Error(junctionError.message)
      }

      return mapOutfit(outfitRow, input.itemIds)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: OUTFITS_KEY(user.id) })
    },
  })
}

export function useDeleteOutfit() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated')

      // Cascade on outfit_items is handled by the DB foreign key
      const { error } = await supabase.from('outfits').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: OUTFITS_KEY(user.id) })
    },
  })
}
