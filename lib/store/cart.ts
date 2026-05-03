'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, ProductCard } from '@/types'
import { generateId } from '@/lib/utils'

function closeWishlistDrawer() {
  // Lazy require avoids cart ↔ wishlist circular init while keeping a single drawer open.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime-only cross-store call
  require('@/lib/store/wishlist').useWishlistStore.getState().close()
}

interface CartStoreState {
  items: CartItem[]
  isOpen: boolean
}

interface CartStoreActions {
  addItem: (product: ProductCard, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

type CartStore = CartStoreState & CartStoreActions

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: ProductCard, quantity = 1) => {
        closeWishlistDrawer()
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
              isOpen: true,
            }
          }
          const newItem: CartItem = { id: generateId(), product, quantity }
          return { items: [...state.items, newItem], isOpen: true }
        })
      },

      removeItem: (id: string) => {
        set(state => ({
          items: state.items.filter(i => i.id !== id),
        }))
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.id === id ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => {
        closeWishlistDrawer()
        set({ isOpen: true })
      },
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'autocast-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ items: state.items }),
      skipHydration: true,
    }
  )
)

// Selectors
export const selectCartTotal = (state: CartStoreState) =>
  state.items.reduce(
    (sum, item) =>
      sum + (item.product.sale_price ?? item.product.price) * item.quantity,
    0
  )

export const selectCartCount = (state: CartStoreState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)
