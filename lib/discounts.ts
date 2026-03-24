import type { Product, ProductCard } from '@/types'

export const DISCOUNTS_COOKIE_KEY = 'autocast-discounts'

export type DiscountOverrides = Record<string, number>

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 95) return 95
  return Math.round(value)
}

export function salePriceFromPercent(price: number, percent: number): number {
  const safePercent = clampDiscountPercent(percent)
  const sale = Math.round(price * (1 - safePercent / 100))
  return Math.max(0, sale)
}

export function applyDiscountToProduct<T extends Product | ProductCard>(
  product: T,
  overrides: DiscountOverrides
): T {
  const percent = overrides[product.id]
  if (percent === undefined) return product
  return {
    ...product,
    sale_price: salePriceFromPercent(product.price, percent),
  }
}

export function applyDiscountsToProducts<T extends Product | ProductCard>(
  products: T[],
  overrides: DiscountOverrides
): T[] {
  return products.map(product => applyDiscountToProduct(product, overrides))
}

export function parseDiscountOverrides(rawCookie?: string): DiscountOverrides {
  if (!rawCookie) return {}
  try {
    const decoded = decodeURIComponent(rawCookie)
    const parsed = JSON.parse(decoded) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const entries = Object.entries(parsed as Record<string, unknown>)
    return entries.reduce<DiscountOverrides>((acc, [key, value]) => {
      if (typeof value !== 'number') return acc
      acc[key] = clampDiscountPercent(value)
      return acc
    }, {})
  } catch {
    return {}
  }
}
