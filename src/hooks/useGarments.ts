import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Category, ClothingItem, Fabric, Occasion, Season } from '../types'

// ---------------------------------------------------------------------------
// Types for DB rows
// ---------------------------------------------------------------------------

interface GarmentRow {
  id: string
  user_id: string
  name: string
  category: string
  color: string
  color_name: string
  season: string[]
  occasions: string[]
  image_path: string | null
  label_image_path: string | null
  fabrics: string[] | null
  brand: string | null
  date_added: string
  times_worn: number
  last_worn: string | null
  favorite: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

// Fields accepted when adding a new garment (imageFile is handled separately)
export interface AddGarmentInput {
  name: string
  category: Category
  color: string
  colorName: string
  season: Season[]
  occasions: Occasion[]
  imageFile?: File
  labelImageFile?: File
  fabrics?: Fabric[]
  brand?: string
}

// Fields accepted when updating an existing garment
export type UpdateGarmentInput = Partial<
  Omit<AddGarmentInput, 'imageFile' | 'labelImageFile'>
> & {
  imageFile?: File
  labelImageFile?: File
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BUCKET = 'garment-images'
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 // 1 year in seconds

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY)
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL for ${path}: ${error?.message}`)
  }
  return data.signedUrl
}

async function uploadImage(
  userId: string,
  file: File,
  prefix: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  return path
}

async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`Image delete failed: ${error.message}`)
}

async function mapGarment(row: GarmentRow): Promise<ClothingItem> {
  let imageUrl = ''
  if (row.image_path) {
    imageUrl = await getSignedUrl(row.image_path)
  }

  let labelImageUrl: string | undefined
  if (row.label_image_path) {
    labelImageUrl = await getSignedUrl(row.label_image_path)
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    color: row.color,
    colorName: row.color_name,
    season: (row.season ?? []) as Season[],
    occasions: (row.occasions ?? []) as Occasion[],
    imageUrl,
    labelImageUrl,
    fabrics: (row.fabrics ?? []) as Fabric[],
    brand: row.brand ?? undefined,
    dateAdded: row.date_added,
    timesWorn: row.times_worn,
    lastWorn: row.last_worn ?? undefined,
    favorite: row.favorite,
  }
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const GARMENTS_KEY = (userId: string) => ['garments', userId] as const

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useGarments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: GARMENTS_KEY(user?.id ?? ''),
    enabled: !!user,
    queryFn: async (): Promise<ClothingItem[]> => {
      const { data, error } = await supabase
        .from('garments')
        .select('*')
        .order('date_added', { ascending: false })

      if (error) throw new Error(error.message)

      const rows = (data ?? []) as GarmentRow[]
      return Promise.all(rows.map(mapGarment))
    },
  })
}

export function useAddGarment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddGarmentInput): Promise<ClothingItem> => {
      if (!user) throw new Error('Not authenticated')

      let imagePath: string | null = null
      let labelImagePath: string | null = null

      if (input.imageFile) {
        imagePath = await uploadImage(user.id, input.imageFile, 'garment')
      }
      if (input.labelImageFile) {
        labelImagePath = await uploadImage(user.id, input.labelImageFile, 'label')
      }

      const { data, error } = await supabase
        .from('garments')
        .insert({
          user_id: user.id,
          name: input.name,
          category: input.category,
          color: input.color,
          color_name: input.colorName,
          season: input.season,
          occasions: input.occasions,
          image_path: imagePath,
          label_image_path: labelImagePath,
          fabrics: input.fabrics ?? [],
          brand: input.brand ?? null,
        })
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      return mapGarment(data as GarmentRow)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: GARMENTS_KEY(user.id) })
    },
  })
}

export function useUpdateGarment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: UpdateGarmentInput
    }): Promise<ClothingItem> => {
      if (!user) throw new Error('Not authenticated')

      const patch: Record<string, unknown> = {}

      if (updates.name !== undefined) patch.name = updates.name
      if (updates.category !== undefined) patch.category = updates.category
      if (updates.color !== undefined) patch.color = updates.color
      if (updates.colorName !== undefined) patch.color_name = updates.colorName
      if (updates.season !== undefined) patch.season = updates.season
      if (updates.occasions !== undefined) patch.occasions = updates.occasions
      if (updates.fabrics !== undefined) patch.fabrics = updates.fabrics
      if (updates.brand !== undefined) patch.brand = updates.brand

      if (updates.imageFile) {
        patch.image_path = await uploadImage(user.id, updates.imageFile, 'garment')
      }
      if (updates.labelImageFile) {
        patch.label_image_path = await uploadImage(
          user.id,
          updates.labelImageFile,
          'label'
        )
      }

      const { data, error } = await supabase
        .from('garments')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      return mapGarment(data as GarmentRow)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: GARMENTS_KEY(user.id) })
    },
  })
}

export function useDeleteGarment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated')

      // Fetch the row first so we can delete its storage objects
      const { data: row, error: fetchError } = await supabase
        .from('garments')
        .select('image_path, label_image_path')
        .eq('id', id)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      const { error: deleteError } = await supabase
        .from('garments')
        .delete()
        .eq('id', id)

      if (deleteError) throw new Error(deleteError.message)

      const garmentRow = row as Pick<GarmentRow, 'image_path' | 'label_image_path'>
      if (garmentRow.image_path) await deleteImage(garmentRow.image_path)
      if (garmentRow.label_image_path) await deleteImage(garmentRow.label_image_path)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: GARMENTS_KEY(user.id) })
    },
  })
}

export function useToggleFavorite() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      currentValue,
    }: {
      id: string
      currentValue: boolean
    }): Promise<void> => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('garments')
        .update({ favorite: !currentValue })
        .eq('id', id)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: GARMENTS_KEY(user.id) })
    },
  })
}

export function useLogWear() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      currentTimesWorn,
    }: {
      id: string
      currentTimesWorn: number
    }): Promise<void> => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('garments')
        .update({
          times_worn: currentTimesWorn + 1,
          last_worn: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: GARMENTS_KEY(user.id) })
    },
  })
}
