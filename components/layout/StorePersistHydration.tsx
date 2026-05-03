'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'

/** After React hydrates, load persisted cart / wishlist from localStorage (see persist `skipHydration`). */
export default function StorePersistHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useWishlistStore.persist.rehydrate()
  }, [])
  return null
}
