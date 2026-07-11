'use client'

import { useAdminCurrencyStore, selectRateFetchedAt, selectUsdRate } from '@/lib/store/currency'
import { formatDate } from '@/lib/utils'

export default function AdminUsdRateBar() {
  const usdRate = useAdminCurrencyStore(selectUsdRate)
  const rateFetchedAt = useAdminCurrencyStore(selectRateFetchedAt)
  const rateLoading = useAdminCurrencyStore(s => s.rateLoading)
  const rateError = useAdminCurrencyStore(s => s.rateError)

  const updatedLabel = rateFetchedAt
    ? formatDate(rateFetchedAt)
    : '—'

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-bg-surface/95 backdrop-blur-xl px-4 md:px-8 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-text-primary">Курс НБУ</span>
          {rateLoading ? (
            <span className="text-text-muted">Завантаження…</span>
          ) : usdRate ? (
            <span className="text-text-primary">
              1 USD = <span className="font-semibold tabular-nums">{usdRate.toFixed(2)}</span> ₴
            </span>
          ) : (
            <span className="text-text-muted">{rateError ?? 'Курс недоступний'}</span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          Оновлення раз на 24 год · актуально на {updatedLabel}
        </span>
      </div>
    </div>
  )
}
