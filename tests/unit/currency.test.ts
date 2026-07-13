import { describe, it, expect } from 'vitest'
import { convertUahToUsd } from '@/lib/currency/convert'
import { parseNbuExchangeDate } from '@/lib/currency/nbu'
import { formatMoney, formatAdminDualPrice } from '@/lib/currency/format'
import { parseCurrencyCookie } from '@/lib/currency/cookies'

describe('convertUahToUsd', () => {
  it('converts UAH to USD with 2 decimal places', () => {
    expect(convertUahToUsd(4150, 41.5)).toBe(100)
    expect(convertUahToUsd(4150, 41.5)).toBe(100)
    expect(convertUahToUsd(1234, 41.5)).toBe(29.73)
  })

  it('returns 0 for invalid inputs', () => {
    expect(convertUahToUsd(100, 0)).toBe(0)
    expect(convertUahToUsd(Number.NaN, 41.5)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats UAH with NBSP thousands separator', () => {
    expect(formatMoney(1000)).toBe('1\u00A0000\u00A0₴')
    expect(formatMoney(1234567)).toBe('1\u00A0234\u00A0567\u00A0₴')
  })

  it('formats USD with rate', () => {
    expect(formatMoney(4150, { currency: 'USD', usdRate: 41.5 })).toBe('100.00\u00A0$')
    expect(formatMoney(1234, { currency: 'USD', usdRate: 41.5 })).toBe('29.73\u00A0$')
  })

  it('falls back to UAH when USD rate is missing', () => {
    expect(formatMoney(1000, { currency: 'USD', usdRate: null })).toBe('1\u00A0000\u00A0₴')
  })
})

describe('parseNbuExchangeDate', () => {
  it('parses DD.MM.YYYY from NBU', () => {
    const iso = parseNbuExchangeDate('13.07.2026')
    expect(new Date(iso).getFullYear()).toBe(2026)
    expect(new Date(iso).getMonth()).toBe(6)
    expect(new Date(iso).getDate()).toBe(13)
  })

  it('falls back for invalid input', () => {
    expect(() => parseNbuExchangeDate('not-a-date')).not.toThrow()
  })
})

describe('formatAdminDualPrice', () => {
  it('shows UAH and USD together', () => {
    expect(formatAdminDualPrice(4150, 41.5)).toBe('4\u00A0150\u00A0₴ · 100.00\u00A0$')
  })

  it('falls back to UAH when rate is missing', () => {
    expect(formatAdminDualPrice(1000, null)).toBe('1\u00A0000\u00A0₴')
  })
})

describe('parseCurrencyCookie', () => {
  it('parses valid currency codes', () => {
    expect(parseCurrencyCookie('UAH')).toBe('UAH')
    expect(parseCurrencyCookie('USD')).toBe('USD')
  })

  it('defaults to UAH for invalid or empty values', () => {
    expect(parseCurrencyCookie()).toBe('UAH')
    expect(parseCurrencyCookie('')).toBe('UAH')
    expect(parseCurrencyCookie('EUR')).toBe('UAH')
  })
})
