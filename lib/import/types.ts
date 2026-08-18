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
  /** True when the feed scan stopped early (time budget). */
  partial?: boolean
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
  /** Hard-deleted products (Caralarm OOS sync). */
  deleted?: number
  /** False when a time-budgeted run needs another pass. */
  done?: boolean
}

export interface ImportProgressEvent {
  type: 'status' | 'progress' | 'done' | 'error'
  message?: string
  processed?: number
  total?: number
  created?: number
  updated?: number
  skipped?: number
  deleted?: number
  result?: ImportResult
  preview?: ImportPreview
  error?: string
}
