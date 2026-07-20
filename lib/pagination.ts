export const ADMIN_PRODUCTS_PAGE_SIZE = 10
export const SHOP_PRODUCTS_PAGE_SIZE = 12

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 1
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1
  return Math.ceil(totalItems / pageSize)
}

export function clampPage(page: number, totalPages: number): number {
  const safeTotal =
    Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : 1
  if (!Number.isFinite(page) || page < 1) return 1
  return Math.min(Math.floor(page), safeTotal)
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = getTotalPages(items.length, pageSize)
  const safePage = clampPage(page, totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function pageRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems === 0) return '0 з 0'
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return `${start}–${end} з ${totalItems}`
}
