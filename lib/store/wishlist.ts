'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductCard } from '@/types'

function closeCartDrawer() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime-only cross-store call
  require('@/lib/store/cart').useCartStore.getState().closeCart()
}

interface WishlistStoreState {
  items: ProductCard[]
  isOpen: boolean
}

interface WishlistStoreActions {
  add: (product: ProductCard) => void
  remove: (productId: string) => void
  toggle: (product: ProductCard) => void
  clear: () => void
  open: () => void
  close: () => void
}

type WishlistStore = WishlistStoreState & WishlistStoreActions

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      add: (product) => {
        set(state => {
          if (state.items.some(p => p.id === product.id)) return state
          return { items: [product, ...state.items] }
        })
      },
      remove: (productId) => {
        set(state => ({ items: state.items.filter(p => p.id !== productId) }))
      },
      toggle: (product) => {
        const exists = get().items.some(p => p.id === product.id)
        if (exists) {
          get().remove(product.id)
        } else {
          get().add(product)
        }
      },
      clear: () => set({ items: [] }),

      open: () => {
        closeCartDrawer()
        set({ isOpen: true })
      },
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'autocast-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ items: state.items }),
    }
  )
)

export const selectWishlistCount = (state: WishlistStoreState) => state.items.length
export const selectIsWished = (productId: string) => (state: WishlistStoreState) =>
  state.items.some(p => p.id === productId)

