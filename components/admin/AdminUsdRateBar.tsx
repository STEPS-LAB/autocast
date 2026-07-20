'use client'

import { useEffect, useState } from 'react'
import { useAdminCurrencyStore, selectUsdRate } from '@/lib/store/currency'

export default function AdminUsdRateBar() {
  const [mounted, setMounted] = useState(false)
  const usdRate = useAdminCurrencyStore(selectUsdRate)
  const rateLoading = useAdminCurrencyStore(s => s.rateLoading)
  const rateError = useAdminCurrencyStore(s => s.rateError)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showLoading = !mounted || rateLoading

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {showLoading ? (
          <span className="text-text-muted">Завантаження…</span>
        ) : usdRate ? (
          <span className="text-text-primary">
            1 USD = <span className="font-semibold tabular-nums">{usdRate.toFixed(2)}</span> ₴
          </span>
        ) : (
          <span className="text-text-muted">{rateError ?? 'Курс недоступний'}</span>
        )}
      </div>
      <span className="text-xs text-text-muted">Оновлення раз на 24 год</span>
    </div>
  )
}
