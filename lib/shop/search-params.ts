import {
  DEFAULT_SHOP_PRODUCT_SORT,
  SHOP_PRODUCT_SORT_OPTIONS,
  parseProductSortKey,
  type ProductSortKey,
} from '@/lib/product-sort'

export type ShopSearchInput = {
  q?: string
  category: string[]
  brand: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort: ProductSortKey
  page: number
}

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return Array.from(new Set(list.map(s => s.trim()).filter(Boolean)))
}

function asNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function parseShopSearchParams(
  sp: Record<string, string | string[] | undefined>
): ShopSearchInput {
  const pageRaw = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page ?? '1')
  return {
    q: (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined,
    category: asArray(sp.category),
    brand: asArray(sp.brand),
    minPrice: asNumber(sp.minPrice),
    maxPrice: asNumber(sp.maxPrice),
    inStock: (Array.isArray(sp.inStock) ? sp.inStock[0] : sp.inStock) === '1',
    sort: parseProductSortKey(
      Array.isArray(sp.sort) ? sp.sort[0] : sp.sort,
      SHOP_PRODUCT_SORT_OPTIONS,
      DEFAULT_SHOP_PRODUCT_SORT
    ),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  }
}
