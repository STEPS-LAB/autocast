'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DISCOUNTS_COOKIE_KEY, clampDiscountPercent, type DiscountOverrides } from '@/lib/discounts'

interface DiscountStoreState {
  overrides: DiscountOverrides
}

interface DiscountStoreActions {
  setDiscountPercent: (productId: string, percent: number) => void
  clearDiscount: (productId: string) => void
}

type DiscountStore = DiscountStoreState & DiscountStoreActions

function syncDiscountCookie(overrides: DiscountOverrides) {
  const encoded = encodeURIComponent(JSON.stringify(overrides))
  document.cookie = `${DISCOUNTS_COOKIE_KEY}=${encoded}; path=/; max-age=31536000; samesite=lax`
}

export const useDiscountStore = create<DiscountStore>()(
  persist(
    (set) => ({
      overrides: {},
      setDiscountPercent: (productId, percent) => {
        set(state => {
          const next = {
            ...state.overrides,
            [productId]: clampDiscountPercent(percent),
          }
          syncDiscountCookie(next)
          return { overrides: next }
        })
      },
      clearDiscount: (productId) => {
        set(state => {
          const next = { ...state.overrides }
          delete next[productId]
          syncDiscountCookie(next)
          return { overrides: next }
        })
      },
    }),
    {
      name: 'autocast-discounts',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) syncDiscountCookie(state.overrides)
      },
    }
  )
)

export const selectDiscountOverrides = (state: DiscountStoreState) => state.overrides
