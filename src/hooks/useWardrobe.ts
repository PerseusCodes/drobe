import { useState, useEffect, useCallback } from 'react'
import type { ClothingItem, Outfit } from '../types'

const ITEMS_KEY = 'drobe_items'
const OUTFITS_KEY = 'drobe_outfits'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useWardrobe() {
  const [items, setItems] = useState<ClothingItem[]>(() =>
    loadFromStorage<ClothingItem[]>(ITEMS_KEY, [])
  )
  const [outfits, setOutfits] = useState<Outfit[]>(() =>
    loadFromStorage<Outfit[]>(OUTFITS_KEY, [])
  )

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
    } catch {
      // QuotaExceededError — silently skip, data stays in memory
      console.warn('localStorage quota exceeded for items')
    }
  }, [items])

  useEffect(() => {
    try {
      localStorage.setItem(OUTFITS_KEY, JSON.stringify(outfits))
    } catch {
      console.warn('localStorage quota exceeded for outfits')
    }
  }, [outfits])

  const addItem = useCallback((item: ClothingItem) => {
    setItems(prev => [item, ...prev])
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<ClothingItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)))
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setOutfits(prev =>
      prev.filter(o => !o.items.includes(id))
    )
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, favorite: !i.favorite } : i))
    )
  }, [])

  const logWear = useCallback((id: string) => {
    const today = new Date().toISOString().split('T')[0]
    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, timesWorn: i.timesWorn + 1, lastWorn: today }
          : i
      )
    )
  }, [])

  const saveOutfit = useCallback((outfit: Outfit) => {
    setOutfits(prev => [outfit, ...prev])
  }, [])

  const deleteOutfit = useCallback((id: string) => {
    setOutfits(prev => prev.filter(o => o.id !== id))
  }, [])

  return {
    items,
    outfits,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    logWear,
    saveOutfit,
    deleteOutfit,
  }
}
