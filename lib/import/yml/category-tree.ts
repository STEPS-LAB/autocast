import type { YmlCategory } from './types'

/** Shop taxonomy: root + one subcategory level only (≈30 items, not car model trees). */
export const YML_CATEGORY_MAX_DEPTH = 1

export interface CategoryImportNode {
  feedId: string
  name: string
  parentFeedId: string | null
  depth: number
  sortOrder: number
}

function buildById(categories: YmlCategory[]): Map<string, YmlCategory> {
  const byId = new Map<string, YmlCategory>()
  for (const cat of categories) byId.set(cat.id, cat)
  return byId
}

/** Root → … → leaf feed IDs (root first). */
export function feedCategoryChain(
  byId: Map<string, YmlCategory>,
  leafId: string
): string[] {
  const chain: string[] = []
  let current: string | null = leafId.trim()
  const visited = new Set<string>()
  while (current && byId.has(current) && !visited.has(current)) {
    visited.add(current)
    chain.unshift(current)
    current = byId.get(current)?.parentId ?? null
  }
  return chain
}

/**
 * Map a deep feed leaf to the category id at maxDepth
 * (depth 0 = root, depth 1 = subcategory).
 */
export function resolveFeedCategoryIdAtMaxDepth(
  categories: YmlCategory[],
  leafId: string,
  maxDepth: number = YML_CATEGORY_MAX_DEPTH
): string | null {
  const byId = buildById(categories)
  const chain = feedCategoryChain(byId, leafId)
  if (chain.length === 0) return null
  const idx = Math.min(Math.max(0, maxDepth), chain.length - 1)
  return chain[idx] ?? null
}

/**
 * Build an ordered plan of categories to upsert: only nodes up to maxDepth,
 * derived from used product leaves (deep leaves are collapsed to maxDepth).
 */
export function buildCategoryImportPlan(
  categories: YmlCategory[],
  usedLeafIds: Iterable<string>,
  maxDepth: number = YML_CATEGORY_MAX_DEPTH
): CategoryImportNode[] {
  const byId = buildById(categories)
  const needed = new Set<string>()

  for (const leafId of usedLeafIds) {
    const resolved = resolveFeedCategoryIdAtMaxDepth(categories, leafId, maxDepth)
    if (!resolved) continue
    const chain = feedCategoryChain(byId, resolved)
    for (const id of chain) needed.add(id)
  }

  function depthOf(feedId: string): number {
    return Math.max(0, feedCategoryChain(byId, feedId).length - 1)
  }

  const nodes: CategoryImportNode[] = []
  for (const feedId of needed) {
    const cat = byId.get(feedId)
    if (!cat) continue
    const depth = depthOf(feedId)
    if (depth > maxDepth) continue

    const parentFeedId =
      depth > 0 && cat.parentId && needed.has(cat.parentId) ? cat.parentId : null

    nodes.push({
      feedId,
      name: cat.name.trim() || `Категорія ${feedId}`,
      parentFeedId,
      depth,
      sortOrder: 0,
    })
  }

  nodes.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth
    return a.name.localeCompare(b.name, 'uk')
  })

  const counters = new Map<string | null, number>()
  for (const node of nodes) {
    const key = node.parentFeedId
    const next = (counters.get(key) ?? 0) + 1
    counters.set(key, next)
    node.sortOrder = key == null ? 200 + next - 1 : next
  }

  return nodes
}

/** Human-readable path capped at maxDepth, e.g. "Автосвітло › LED лампи". */
export function formatCategoryPath(
  categories: YmlCategory[],
  leafId: string,
  maxDepth: number = YML_CATEGORY_MAX_DEPTH
): string {
  const byId = buildById(categories)
  const resolved = resolveFeedCategoryIdAtMaxDepth(categories, leafId, maxDepth)
  if (!resolved) return `Категорія ${leafId}`

  const chain = feedCategoryChain(byId, resolved)
  const parts = chain.map(id => {
    const cat = byId.get(id)
    return cat?.name.trim() || `Категорія ${id}`
  })
  return parts.join(' › ')
}
