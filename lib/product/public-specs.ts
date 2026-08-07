import {
  LEGACY_OFFER_ID_SPEC_KEY,
  YML_OFFER_ID_SPEC_KEY,
  YML_PDF_SPEC_KEY,
  YML_SOURCE_URL_SPEC_KEY,
} from '@/lib/import/yml/types'
import {
  CARALARM_CODE_SPEC_KEY,
  CARALARM_OFFER_ID_SPEC_KEY,
  SUPPLIER_SPEC_KEY,
} from '@/lib/import/caralarm/types'

/** Spec keys kept for import/sync but never shown on the storefront. */
export const HIDDEN_PUBLIC_SPEC_KEYS = new Set([
  YML_OFFER_ID_SPEC_KEY,
  LEGACY_OFFER_ID_SPEC_KEY,
  YML_SOURCE_URL_SPEC_KEY,
  YML_PDF_SPEC_KEY,
  SUPPLIER_SPEC_KEY,
  CARALARM_OFFER_ID_SPEC_KEY,
  CARALARM_CODE_SPEC_KEY,
  'Offer ID',
  'Torssen ID',
  'Джерело',
  'джерело',
  'PDF',
])

export function getPublicSpecEntries(
  specs: Record<string, string>
): Array<[string, string]> {
  return Object.entries(specs).filter(
    ([key, value]) =>
      !HIDDEN_PUBLIC_SPEC_KEYS.has(key) &&
      typeof value === 'string' &&
      value.trim() !== ''
  )
}
