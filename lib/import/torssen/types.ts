import type {
  ImportPreview,
  ImportPreviewItem,
  ImportResult,
} from '@/lib/import/drivex/types'

export const TORSSEN_OFFER_ID_SPEC_KEY = 'Torssen ID'
export const TORSSEN_VENDOR_CODE_SPEC_KEY = 'Артикул'
export const TORSSEN_SOURCE_URL_SPEC_KEY = 'Джерело'

export interface TorssenCategory {
  id: string
  name: string
  parentId: string | null
}

export interface ParsedTorssenOffer {
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

export interface TorssenParseResult {
  categories: TorssenCategory[]
  products: ParsedTorssenOffer[]
  skippedOutOfStock: number
  skippedDuplicateId: number
  skippedInvalid: number
  totalOffers: number
}

export type { ImportPreview, ImportPreviewItem, ImportResult }
