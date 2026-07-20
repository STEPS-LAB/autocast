import { unstable_cache } from 'next/cache'
import { fetchNbuUsdRate } from '@/lib/currency/nbu'

const FALLBACK_USD_RATE = 41.5

const getCachedNbuUsdRate = unstable_cache(
  async () => fetchNbuUsdRate(),
  ['nbu-usd-rate'],
  { revalidate: 86_400 }
)

export async function getUsdRate() {
  try {
    return await getCachedNbuUsdRate()
  } catch {
    return {
      rate: FALLBACK_USD_RATE,
      fetchedAt: new Date().toISOString(),
      source: 'fallback' as const,
    }
  }
}
