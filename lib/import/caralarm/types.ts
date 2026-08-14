/** Dedup / identity keys for Caralarm supplier — must not collide with YML Offer ID. */
export const SUPPLIER_SPEC_KEY = 'Постачальник'
export const CARALARM_SUPPLIER = 'Caralarm'
export const CARALARM_OFFER_ID_SPEC_KEY = 'Caralarm ID'
export const CARALARM_CODE_SPEC_KEY = 'Код товару'

/** Market feed uses numeric status codes; export uses true/false. */
export type CaralarmAvailableFrom = 'status' | 'boolean'

export type CaralarmFeedDialect = {
  /** How to interpret `available="…"` on `<offer>`. */
  availableFrom: CaralarmAvailableFrom
  /** Category id tag inside offer (`categoryId` vs `categoryID`). */
  categoryTag: 'categoryId' | 'categoryID'
  /** Product code tag (`kodTovara` in market, `model` in export). */
  codeTag: 'kodTovara' | 'model'
}

export const MARKET_FEED_DIALECT: CaralarmFeedDialect = {
  availableFrom: 'status',
  categoryTag: 'categoryId',
  codeTag: 'kodTovara',
}

export const EXPORT_FEED_DIALECT: CaralarmFeedDialect = {
  availableFrom: 'boolean',
  categoryTag: 'categoryID',
  codeTag: 'model',
}

export type CaralarmAvailabilityStatus = 0 | 1 | 2 | 3

export interface CaralarmOffer {
  offerId: string
  /** Raw available attribute as in the feed. */
  availableRaw: string
  /** Parsed status for market feed; null when dialect is boolean. */
  availableStatus: CaralarmAvailabilityStatus | null
  /** Boolean availability (export feed or mapped). */
  available: boolean
  name: string
  productCode: string | null
  vendor: string | null
  categoryId: string
  categoryName: string
  priceUsd: number | null
  priceUah: number | null
  priceMinUsd: number | null
  priceMinUah: number | null
  currencyId: string | null
  description: string
  descriptionShort: string
  pictures: string[]
  params: Record<string, string>
  url: string | null
}

export interface CaralarmParseResult {
  categories: import('@/lib/import/yml/types').YmlCategory[]
  offers: CaralarmOffer[]
  skippedInvalid: number
  skippedDuplicateId: number
  totalOffers: number
}

export type CaralarmSyncMode = 'catalog' | 'prices'

export interface CaralarmSyncResult {
  created: number
  updated: number
  deleted: number
  skipped: number
  priceUpdates: number
  errors: string[]
  processed: number
  total: number
  /** True when this run finished the full intended work. */
  done: boolean
}

export interface CaralarmSyncProgress {
  processed: number
  total: number
  created: number
  updated: number
  deleted: number
  skipped: number
  message?: string
}
