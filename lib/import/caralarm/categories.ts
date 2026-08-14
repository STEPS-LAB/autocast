import type { YmlCategory } from '@/lib/import/yml/types'

/** Root category names (UA) that must not be imported. */
export const CARALARM_BLOCKED_ROOT_NAMES = [
  'Рекламна продукція',
  'Знижені в ціні товари',
] as const

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

const BLOCKED_NORMALIZED = new Set(
  CARALARM_BLOCKED_ROOT_NAMES.map(n => normalizeName(n))
)

/** Walk up to the root category id. */
export function rootCategoryId(
  categories: YmlCategory[],
  categoryId: string
): string {
  const byId = new Map(categories.map(c => [c.id, c]))
  let current = categoryId
  const seen = new Set<string>()
  while (true) {
    if (seen.has(current)) return current
    seen.add(current)
    const node = byId.get(current)
    if (!node?.parentId) return current
    current = node.parentId
  }
}

export function isBlockedCaralarmCategory(
  categories: YmlCategory[],
  categoryId: string
): boolean {
  const rootId = rootCategoryId(categories, categoryId)
  const root = categories.find(c => c.id === rootId)
  if (!root) return false
  return BLOCKED_NORMALIZED.has(normalizeName(root.name))
}

/** Filter out offers whose leaf category sits under a blocked root. */
export function filterBlockedCategoryOffers<T extends { categoryId: string }>(
  categories: YmlCategory[],
  offers: T[]
): { kept: T[]; blocked: number } {
  const kept: T[] = []
  let blocked = 0
  for (const offer of offers) {
    if (isBlockedCaralarmCategory(categories, offer.categoryId)) {
      blocked += 1
      continue
    }
    kept.push(offer)
  }
  return { kept, blocked }
}
