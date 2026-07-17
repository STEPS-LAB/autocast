import { effectiveUnitPrice } from '@/lib/utils'

export type ProductSortKey =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'stock_desc'

export const SHOP_PRODUCT_SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'name_asc', label: 'Назва: А → Я' },
  { value: 'name_desc', label: 'Назва: Я → А' },
  { value: 'price_asc', label: 'Ціна: зростання' },
  { value: 'price_desc', label: 'Ціна: спадання' },
]

export const ADMIN_PRODUCT_SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'newest', label: 'Спочатку нові' },
  { value: 'oldest', label: 'Спочатку старі' },
  { value: 'name_asc', label: 'Назва: А → Я' },
  { value: 'name_desc', label: 'Назва: Я → А' },
  { value: 'price_asc', label: 'Ціна: зростання' },
  { value: 'price_desc', label: 'Ціна: спадання' },
  { value: 'stock_asc', label: 'Залишок: зростання' },
  { value: 'stock_desc', label: 'Залишок: спадання' },
]

export const DEFAULT_SHOP_PRODUCT_SORT: ProductSortKey = 'name_asc'
export const DEFAULT_ADMIN_PRODUCT_SORT: ProductSortKey = 'name_asc'

export function parseProductSortKey(
  raw: string | null | undefined,
  allowed: { value: ProductSortKey }[],
  fallback: ProductSortKey
): ProductSortKey {
  if (!raw || raw === 'default' || raw === 'sale') return fallback
  if (allowed.some(option => option.value === raw)) {
    return raw as ProductSortKey
  }
  return fallback
}

type SortableProduct = {
  name_ua: string
  price: number
  sale_price: number | null
  stock: number
  created_at?: string
}

export function sortProducts<T extends SortableProduct>(products: T[], sortKey: ProductSortKey): T[] {
  const sorted = [...products]
  switch (sortKey) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())
      break
    case 'name_asc':
      sorted.sort((a, b) => a.name_ua.localeCompare(b.name_ua, 'uk'))
      break
    case 'name_desc':
      sorted.sort((a, b) => b.name_ua.localeCompare(a.name_ua, 'uk'))
      break
    case 'price_asc':
      sorted.sort(
        (a, b) =>
          effectiveUnitPrice(a.price, a.sale_price) - effectiveUnitPrice(b.price, b.sale_price)
      )
      break
    case 'price_desc':
      sorted.sort(
        (a, b) =>
          effectiveUnitPrice(b.price, b.sale_price) - effectiveUnitPrice(a.price, a.sale_price)
      )
      break
    case 'stock_asc':
      sorted.sort((a, b) => a.stock - b.stock)
      break
    case 'stock_desc':
      sorted.sort((a, b) => b.stock - a.stock)
      break
    case 'newest':
    default:
      sorted.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      break
  }
  return sorted
}
