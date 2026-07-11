export type CurrencyCode = 'UAH' | 'USD'

export const CURRENCY_COOKIE_KEY = 'autocast-currency'

export const DEFAULT_CURRENCY: CurrencyCode = 'UAH'

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'UAH' || value === 'USD'
}
