import { convertUahToUsd } from '@/lib/currency/convert'
import type { CurrencyCode } from '@/lib/currency/types'

export interface FormatMoneyOptions {
  currency?: CurrencyCode
  usdRate?: number | null
}

function formatIntegerWithNbsp(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  const abs = Math.abs(rounded)
  const digits = abs.toString()
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${sign}${withSeparators}`
}

function formatUsdAmount(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const fixed = abs.toFixed(2)
  const [wholePart = '0', fraction = '00'] = fixed.split('.')
  const withSeparators = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${sign}${withSeparators}.${fraction}`
}

export function formatMoney(uahAmount: number, options: FormatMoneyOptions = {}): string {
  const currency = options.currency ?? 'UAH'

  if (currency === 'USD') {
    const rate = options.usdRate
    if (!rate || rate <= 0) {
      return formatIntegerWithNbsp(uahAmount) + '\u00A0₴'
    }
    const usd = convertUahToUsd(uahAmount, rate)
    return `${formatUsdAmount(usd)}\u00A0$`
  }

  return `${formatIntegerWithNbsp(uahAmount)}\u00A0₴`
}

export function formatAdminDualPrice(uahAmount: number, usdRate: number | null | undefined): string {
  const uah = formatMoney(uahAmount, { currency: 'UAH' })
  if (!usdRate || usdRate <= 0) return uah
  const usd = formatMoney(uahAmount, { currency: 'USD', usdRate })
  return `${uah} · ${usd}`
}
