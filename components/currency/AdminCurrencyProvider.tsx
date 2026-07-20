'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { fetchUsdRateClient, useAdminCurrencyStore } from '@/lib/store/currency'

const AdminCurrencyContext = createContext<null>(null)

export function AdminCurrencyProvider({ children }: { children: ReactNode }) {
  const setUsdRate = useAdminCurrencyStore(s => s.setUsdRate)
  const setRateLoading = useAdminCurrencyStore(s => s.setRateLoading)
  const setRateError = useAdminCurrencyStore(s => s.setRateError)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setRateLoading(true)
      const result = await fetchUsdRateClient()
      if (cancelled) return

      if (result) {
        setUsdRate(result.rate, result.fetchedAt)
        setRateError(null)
      } else {
        setRateError('Курс тимчасово недоступний')
      }
      setRateLoading(false)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [setRateError, setRateLoading, setUsdRate])

  return (
    <AdminCurrencyContext.Provider value={null}>
      {children}
    </AdminCurrencyContext.Provider>
  )
}

export function useAdminCurrencyContext() {
  return useContext(AdminCurrencyContext)
}
