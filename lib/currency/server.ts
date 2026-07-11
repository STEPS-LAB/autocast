import { formatAdminDualPrice } from '@/lib/currency/format'
import { getUsdRate } from '@/lib/currency/rate'

export async function getServerAdminPriceFormatter() {
  const rateResult = await getUsdRate()

  return {
    usdRate: rateResult.rate,
    rateFetchedAt: rateResult.fetchedAt,
    formatDual: (uahAmount: number) => formatAdminDualPrice(uahAmount, rateResult.rate),
  }
}
