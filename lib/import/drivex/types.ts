export const DRIVEX_PRODUCT_SHEETS = [
  'Музика',
  'Камери',
  'LED та HID лампи',
  'LED лінзи',
  'Фари',
  'Аксесуари',
  'LED малі',
] as const

export const DRIVEX_PRICE_CHANGES_SHEET = 'Зміни у прайсі'
export const DRIVEX_BRAND_NAME = 'Drivex'
export const DEALER_CODE_SPEC_KEY = 'Код база'

export type DrivexProductSheet = (typeof DRIVEX_PRODUCT_SHEETS)[number]

export interface DrivexImage {
  buffer: Buffer
  extension: string
  excelRow: number
}

export interface ParsedDrivexProduct {
  sheet: DrivexProductSheet
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
  images: DrivexImage[]
}

export interface ParsedDrivexPriceChange {
  name: string
  oldRetailPrice: number | null
  newRetailPrice: number | null
}

export interface DrivexParseResult {
  products: ParsedDrivexProduct[]
  priceChanges: ParsedDrivexPriceChange[]
  skippedOutOfStock: number
  skippedDuplicateCode: number
}

export interface ImportPreviewItem {
  dealerCode: string
  name: string
  sheet: string
  price: number
  stock: number
  imageCount: number
  action: 'create' | 'update' | 'skip'
  reason?: string
}

export interface ImportPreview {
  totalParsed: number
  toCreate: number
  toUpdate: number
  skipped: number
  skippedOutOfStock: number
  skippedDuplicateCode: number
  priceChanges: number
  priceChangesMatched: number
  categories: string[]
  sample: ImportPreviewItem[]
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  priceUpdates: number
  imagesUploaded: number
  errors: string[]
}
