import type { Category } from '@/types'
import { SHOP_TAXONOMY_RULES } from '@/lib/import/yml/category-taxonomy'
import { buildCategoryMaps } from '@/lib/shop/category-tree'

/** Nest known shop leaves (Автохімія, Автозвук, …) even if import left them as roots. */
export function applyDisplayCategoryParents(categories: Category[]): Category[] {
  const next = categories.map(c => ({ ...c }))
  for (const rule of SHOP_TAXONOMY_RULES) {
    const parent =
      next.find(c => !c.parent_id && rule.isParent(c.name_ua)) ??
      next.find(c => rule.isParent(c.name_ua))
    if (!parent) continue

    for (const cat of next) {
      if (cat.id === parent.id) continue
      if (!rule.isChild(cat.name_ua)) continue
      if (cat.parent_id === parent.id) continue
      cat.parent_id = parent.id
    }
  }
  return next
}

/** Category ids that have products, plus every ancestor. */
export function collectOccupiedCategoryIds(
  categories: Category[],
  usedLeafIds: Iterable<string>
): Set<string> {
  const { byId } = buildCategoryMaps(categories)
  const occupied = new Set<string>()
  for (const leafId of usedLeafIds) {
    let current: string | null = leafId
    const seen = new Set<string>()
    while (current && !seen.has(current)) {
      seen.add(current)
      occupied.add(current)
      current = byId.get(current)?.parent_id ?? null
    }
  }
  return occupied
}
