'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProductCard } from '@/types'

const KEY = 'autocast-recently-viewed'
const MAX = 8

export function useRecentlyViewed() {
  const [items, setItems] = useState<ProductCard[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setItems(JSON.parse(stored) as ProductCard[])
    } catch {
      // ignore
    }
  }, [])

  const add = useCallback((product: ProductCard) => {
    setItems(prev => {
      const next = [product, ...prev.filter(p => p.id !== product.id)].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    localStorage.removeItem(KEY)
  }, [])

  return { items, add, clear }
}
