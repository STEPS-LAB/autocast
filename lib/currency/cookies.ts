import { CURRENCY_COOKIE_KEY, DEFAULT_CURRENCY, isCurrencyCode } from '@/lib/currency/types'

export { CURRENCY_COOKIE_KEY }

export function parseCurrencyCookie(rawCookie?: string) {
  if (!rawCookie) return DEFAULT_CURRENCY
  const trimmed = rawCookie.trim()
  return isCurrencyCode(trimmed) ? trimmed : DEFAULT_CURRENCY
}
