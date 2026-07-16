import { NON_PRODUCT_SHEET_PATTERNS } from './types'

export function isNonProductSheetName(name: string): boolean {
  const trimmed = name.trim()
  return NON_PRODUCT_SHEET_PATTERNS.some(pattern => pattern.test(trimmed))
}
