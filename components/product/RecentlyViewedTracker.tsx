'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed'
import type { ProductCard } from '@/types'

export default function RecentlyViewedTracker({ product }: { product: ProductCard }) {
  const { add } = useRecentlyViewed()

  useEffect(() => {
    add(product)
  }, [product, add])

  return null
}
