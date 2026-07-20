'use client'

import { create } from 'zustand'

interface AdminCurrencyStoreState {
  usdRate: number | null
  rateFetchedAt: string | null
  rateLoading: boolean
  rateError: string | null
}

interface AdminCurrencyStoreActions {
  setUsdRate: (rate: number | null, fetchedAt?: string | null) => void
  setRateLoading: (loading: boolean) => void
  setRateError: (error: string | null) => void
}

type AdminCurrencyStore = AdminCurrencyStoreState & AdminCurrencyStoreActions

export const useAdminCurrencyStore = create<AdminCurrencyStore>()((set) => ({
  usdRate: null,
  rateFetchedAt: null,
  rateLoading: false,
  rateError: null,
  setUsdRate: (rate, fetchedAt = null) => set({ usdRate: rate, rateFetchedAt: fetchedAt, rateError: null }),
  setRateLoading: (loading) => set({ rateLoading: loading }),
  setRateError: (error) => set({ rateError: error }),
}))

export const selectUsdRate = (state: AdminCurrencyStoreState) => state.usdRate
export const selectRateFetchedAt = (state: AdminCurrencyStoreState) => state.rateFetchedAt

export async function fetchUsdRateClient(): Promise<{ rate: number; fetchedAt: string } | null> {
  try {
    const response = await fetch('/api/currency/rate')
    if (!response.ok) return null
    const data = (await response.json()) as { rate?: number; fetchedAt?: string }
    const rate = Number(data.rate)
    if (!Number.isFinite(rate) || rate <= 0) return null
    return { rate, fetchedAt: data.fetchedAt ?? new Date().toISOString() }
  } catch {
    return null
  }
}
