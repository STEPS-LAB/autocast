import type { ImportPreview, ImportPreviewItem, ImportResult } from '@/lib/import/types'

/** Dealer / base product code used for Excel import upserts. */
export const DEALER_CODE_SPEC_KEY = 'Код база'

/**
 * Sheet names that are never product catalogs (price deltas, notes, etc.).
 * Matched case-insensitively as substring or exact.
 */
export const NON_PRODUCT_SHEET_PATTERNS = [
  /^зміни(\s|$)/i,
  /зміни у прайсі/i,
  /^зміст$/i,
  /^info$/i,
  /^інфо$/i,
]

export interface ExcelImage {
  buffer: Buffer
  extension: string
  excelRow: number
}

export interface ParsedExcelProduct {
  sheet: string
  dealerCode: string
  name: string
  description: string
  price: number
  stock: number
  stockLabel: string | null
  warranty: string | null
  note: string | null
  dealerPrice2: number | null
  dealerPrice: number | null
  wholesalePrice: number | null
  excelRow: number
  images: ExcelImage[]
}

export interface ParsedExcelPriceChange {
  name: string
  oldRetailPrice: number | null
  newRetailPrice: number | null
}

export interface ExcelParseResult {
  products: ParsedExcelProduct[]
  priceChanges: ParsedExcelPriceChange[]
  skippedOutOfStock: number
  skippedDuplicateCode: number
  productSheets: string[]
}

export type { ImportPreview, ImportPreviewItem, ImportResult }
