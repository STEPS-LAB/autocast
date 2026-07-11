'use client'

import { useCallback } from 'react'
import { formatAdminDualPrice, formatMoney } from '@/lib/currency/format'
import { useAdminCurrencyStore, selectUsdRate } from '@/lib/store/currency'

export function useAdminPrice() {
  const usdRate = useAdminCurrencyStore(selectUsdRate)

  const formatDual = useCallback(
    (uahAmount: number) => formatAdminDualPrice(uahAmount, usdRate),
    [usdRate],
  )

  const formatUah = useCallback(
    (uahAmount: number) => formatMoney(uahAmount, { currency: 'UAH' }),
    [],
  )

  return { formatDual, formatUah, usdRate }
}
