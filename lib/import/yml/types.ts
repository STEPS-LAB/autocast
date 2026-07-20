import type {
  ImportPreview,
  ImportPreviewItem,
  ImportResult,
} from '@/lib/import/types'

/** Dedup key for YML/XML offer updates (any supplier using YML). */
export const YML_OFFER_ID_SPEC_KEY = 'Offer ID'
/** Legacy key from earlier imports — still read for matching. */
export const LEGACY_OFFER_ID_SPEC_KEY = 'Torssen ID'
export const YML_VENDOR_CODE_SPEC_KEY = 'Артикул'
export const YML_SOURCE_URL_SPEC_KEY = 'Джерело'

export interface YmlCategory {
  id: string
  name: string
  parentId: string | null
}

export interface ParsedYmlOffer {
  offerId: string
  available: boolean
  name: string
  vendorCode: string | null
  vendor: string | null
  categoryId: string
  categoryName: string
  price: number
  oldPrice: number | null
  stock: number
  description: string
  pictures: string[]
  params: Record<string, string>
  url: string | null
}

export interface YmlParseResult {
  categories: YmlCategory[]
  products: ParsedYmlOffer[]
  skippedOutOfStock: number
  skippedDuplicateId: number
  skippedInvalid: number
  totalOffers: number
}

export type { ImportPreview, ImportPreviewItem, ImportResult }
