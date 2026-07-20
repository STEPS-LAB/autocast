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
  /** Total products processed (created + updated + skipped during write). */
  processed?: number
  total?: number
}

export interface ImportProgressEvent {
  type: 'status' | 'progress' | 'done' | 'error'
  message?: string
  processed?: number
  total?: number
  created?: number
  updated?: number
  skipped?: number
  result?: ImportResult
  error?: string
}
