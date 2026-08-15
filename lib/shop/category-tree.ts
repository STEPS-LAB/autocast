import type { Category } from '@/types'

export function buildCategoryMaps(categories: Category[]) {
  const byId = new Map(categories.map(c => [c.id, c]))
  const bySlug = new Map(categories.map(c => [c.slug, c]))
  const childrenByParentId = new Map<string, Category[]>()

  for (const c of categories) {
    if (!c.parent_id) continue
    const list = childrenByParentId.get(c.parent_id) ?? []
    list.push(c)
    childrenByParentId.set(c.parent_id, list)
  }

  for (const list of childrenByParentId.values()) {
    list.sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.slug.localeCompare(b.slug, 'en') ||
        a.name_ua.localeCompare(b.name_ua, 'uk')
    )
  }

  return { byId, bySlug, childrenByParentId }
}

/** All category IDs in the subtree rooted at `rootId` (including root). */
export function collectSubtreeIds(
  rootId: string,
  childrenByParentId: Map<string, Category[]>
): string[] {
  const out: string[] = []
  const stack = [rootId]
  while (stack.length > 0) {
    const id = stack.pop()!
    out.push(id)
    const kids = childrenByParentId.get(id) ?? []
    for (const k of kids) stack.push(k.id)
  }
  return out
}

/**
 * Resolve which product.category_id values match the shop filters.
 * - rootSlug: limit to that root's tree (category page)
 * - selectedSlugs: further narrow to those nodes' subtrees
 * Returns null when no category constraint applies (show all).
 */
export function resolveShopCategoryIds(
  categories: Category[],
  rootSlug: string | null | undefined,
  selectedSlugs: string[]
): string[] | null {
  const { bySlug, childrenByParentId } = buildCategoryMaps(categories)

  if (rootSlug) {
    const root = bySlug.get(rootSlug)
    if (!root || root.parent_id) return []
    const treeIds = new Set(collectSubtreeIds(root.id, childrenByParentId))

    if (selectedSlugs.length === 0) return Array.from(treeIds)

    const narrowed = new Set<string>()
    for (const slug of selectedSlugs) {
      const node = bySlug.get(slug)
      if (!node || !treeIds.has(node.id)) continue
      for (const id of collectSubtreeIds(node.id, childrenByParentId)) {
        narrowed.add(id)
      }
    }
    return Array.from(narrowed)
  }

  if (selectedSlugs.length === 0) return null

  const ids = new Set<string>()
  for (const slug of selectedSlugs) {
    const node = bySlug.get(slug)
    if (!node) continue
    for (const id of collectSubtreeIds(node.id, childrenByParentId)) {
      ids.add(id)
    }
  }
  return Array.from(ids)
}

/** Union of `resolveShopCategoryIds` across several live roots (merged alias groups). */
export function resolveShopCategoryIdsForRoots(
  categories: Category[],
  rootSlugs: string[],
  selectedSlugs: string[]
): string[] {
  const ids = new Set<string>()
  for (const slug of rootSlugs) {
    const part = resolveShopCategoryIds(categories, slug, selectedSlugs)
    if (!part) continue
    for (const id of part) ids.add(id)
  }
  return Array.from(ids)
}

export function getRootCategories(categories: Category[]): Category[] {
  return categories
    .filter(c => !c.parent_id)
    .slice()
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.slug.localeCompare(b.slug, 'en') ||
        a.name_ua.localeCompare(b.name_ua, 'uk')
    )
}

export function getDirectChildren(categories: Category[], parentId: string): Category[] {
  return categories
    .filter(c => c.parent_id === parentId)
    .slice()
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.slug.localeCompare(b.slug, 'en') ||
        a.name_ua.localeCompare(b.name_ua, 'uk')
    )
}
