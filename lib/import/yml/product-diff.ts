/** Normalized product fields written by YML import. */
export type ProductWritePayload = {
  name_ua: string
  description_ua: string
  price: number
  sale_price: number | null
  stock: number
  category_id: string
  brand_id: string | null
  specs: Record<string, string>
  images: string[]
}

/** Existing DB row fields needed for change detection. */
export type ProductDiffRow = {
  name_ua: string
  description_ua: string | null
  price: number | string
  sale_price: number | string | null
  stock: number | string
  category_id: string | null
  brand_id: string | null
  specs: Record<string, string> | null
  images: string[] | null
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : NaN
}

function numbersEqual(a: unknown, b: unknown): boolean {
  return asNumber(a) === asNumber(b)
}

function nullableEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return (a ?? null) === (b ?? null)
}

function specsEqual(
  existing: Record<string, string> | null | undefined,
  next: Record<string, string>
): boolean {
  const left = existing ?? {}
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(next)
  if (leftKeys.length !== rightKeys.length) return false
  for (const key of rightKeys) {
    if (left[key] !== next[key]) return false
  }
  return true
}

function imagesEqual(existing: string[] | null | undefined, next: string[]): boolean {
  const left = existing ?? []
  if (left.length !== next.length) return false
  return left.every((url, i) => url === next[i])
}

function salePricesEqual(
  existing: number | string | null,
  next: number | null
): boolean {
  if (existing == null && next == null) return true
  if (existing == null || next == null) return false
  return numbersEqual(existing, next)
}

/** True when import payload differs from the stored product row. */
export function productNeedsUpdate(
  existing: ProductDiffRow,
  next: ProductWritePayload,
  options?: { ignoreCategoryAndBrand?: boolean }
): boolean {
  if (existing.name_ua !== next.name_ua) return true
  if ((existing.description_ua || '') !== next.description_ua) return true
  if (!numbersEqual(existing.price, next.price)) return true
  if (!salePricesEqual(existing.sale_price, next.sale_price)) return true
  if (!numbersEqual(existing.stock, next.stock)) return true
  if (!specsEqual(existing.specs, next.specs)) return true
  if (!imagesEqual(existing.images, next.images)) return true

  if (!options?.ignoreCategoryAndBrand) {
    if (existing.category_id !== next.category_id) return true
    if (!nullableEqual(existing.brand_id, next.brand_id)) return true
  }

  return false
}

/** True when list or sale price changed. */
export function pricingNeedsUpdate(
  existing: Pick<ProductDiffRow, 'price' | 'sale_price'>,
  next: Pick<ProductWritePayload, 'price' | 'sale_price'>
): boolean {
  return (
    !numbersEqual(existing.price, next.price) ||
    !salePricesEqual(existing.sale_price, next.sale_price)
  )
}
