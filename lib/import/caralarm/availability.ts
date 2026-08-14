import type { CaralarmAvailabilityStatus, CaralarmOffer } from './types'

/** In stock / supply 1–2 days — keep on site. */
export function isCaralarmInStockStatus(status: CaralarmAvailabilityStatus | null): boolean {
  return status === 1 || status === 3
}

/** Out of stock or reserved — remove from site. */
export function isCaralarmOutOfStockStatus(status: CaralarmAvailabilityStatus | null): boolean {
  return status === 0 || status === 2
}

/**
 * Resolve stock for DB from market-feed status (preferred).
 * Falls back to boolean `available` only when status is missing (should not happen for market).
 */
export function stockFromCaralarmOffer(offer: Pick<CaralarmOffer, 'availableStatus' | 'available'>): number {
  if (offer.availableStatus != null) {
    return isCaralarmInStockStatus(offer.availableStatus) ? 1 : 0
  }
  return offer.available ? 1 : 0
}

export function shouldKeepCaralarmOffer(offer: Pick<CaralarmOffer, 'availableStatus' | 'available'>): boolean {
  return stockFromCaralarmOffer(offer) > 0
}
