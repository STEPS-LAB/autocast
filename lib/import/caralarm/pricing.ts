import type { CaralarmOffer } from './types'

/**
 * Recommended retail price in UAH.
 * 1) priceMinUAH when present
 * 2) else priceMinUSD × (priceUAH / priceUSD) when all three available
 * 3) else null → skip product
 */
export function retailUahFromOffer(offer: Pick<
  CaralarmOffer,
  'priceMinUah' | 'priceMinUsd' | 'priceUah' | 'priceUsd'
>): number | null {
  if (offer.priceMinUah != null && offer.priceMinUah > 0) {
    return Math.round(offer.priceMinUah * 100) / 100
  }

  if (
    offer.priceMinUsd != null &&
    offer.priceMinUsd > 0 &&
    offer.priceUsd != null &&
    offer.priceUsd > 0 &&
    offer.priceUah != null &&
    offer.priceUah > 0
  ) {
    const rate = offer.priceUah / offer.priceUsd
    return Math.round(offer.priceMinUsd * rate * 100) / 100
  }

  return null
}
