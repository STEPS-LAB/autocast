import type { Category } from '@/types'
import { isPlaceholderCategoryName } from '@/lib/import/yml/category-locale'
import { buildCategoryMaps, getRootCategories } from '@/lib/shop/category-tree'

export type CategorySlugGroup = {
  canonical: string
  aliases: readonly string[]
  title: string
}

/**
 * Legacy shop slugs that were renamed or merged. next.config redirects
 * aliases → canonical; the canonical row may not exist yet after import.
 */
export const CATEGORY_SLUG_GROUPS: readonly CategorySlugGroup[] = [
  {
    canonical: 'parkuvalni-kamery-ta-radary',
    aliases: [
      'parkuvalni-kamery',
      'kamery-parkuvalni',
      'parkuvalni-radary',
      'parkuvalni-radary-ta-systemy-videoparkuvannya',
    ],
    title: 'Паркувальні камери та радари',
  },
  {
    canonical: 'avtomahnitoly',
    aliases: ['avtomahnitoly-ta-multymedia'],
    title: 'Автомагнітоли',
  },
]

const SLUG_TO_GROUP = new Map<string, CategorySlugGroup>()
for (const group of CATEGORY_SLUG_GROUPS) {
  SLUG_TO_GROUP.set(group.canonical, group)
  for (const alias of group.aliases) SLUG_TO_GROUP.set(alias, group)
}

export function findCategorySlugGroup(slug: string): CategorySlugGroup | undefined {
  return SLUG_TO_GROUP.get(slug)
}

export function categorySlugGroupMembers(group: CategorySlugGroup): string[] {
  return [group.canonical, ...group.aliases]
}

export function isShopNavCategory(
  cat: Category,
  occupiedIds?: Set<string> | null
): boolean {
  if (isPlaceholderCategoryName(cat.name_ua)) return false
  if (/^інше$/i.test(cat.name_ua.trim())) return false
  if (occupiedIds && !occupiedIds.has(cat.id)) return false
  return true
}

export function isSameCategoryNavSlug(a: string, b: string): boolean {
  if (a === b) return true
  const groupA = findCategorySlugGroup(a)
  const groupB = findCategorySlugGroup(b)
  return !!groupA && groupA === groupB
}

export type ResolvedShopCategory = {
  heading: string
  canonicalSlug: string
  roots: Category[]
  primary: Category
}

function compareRoots(a: Category, b: Category): number {
  return (
    a.sort_order - b.sort_order ||
    a.slug.localeCompare(b.slug, 'en') ||
    a.name_ua.localeCompare(b.name_ua, 'uk')
  )
}

/**
 * Resolve `/shop/[slug]` against live root categories, including merged
 * alias groups. Returns null only when nothing in the catalog can back this URL.
 */
export function resolveShopCategoryPage(
  slug: string,
  categories: Category[]
): ResolvedShopCategory | null {
  const roots = categories.filter(c => !c.parent_id)
  const group = findCategorySlugGroup(slug)
  const exact = roots.find(c => c.slug === slug)

  if (!exact && !group) {
    const node = categories.find(c => c.slug === slug)
    if (node?.parent_id) {
      const { byId } = buildCategoryMaps(categories)
      let current = node
      while (current.parent_id) {
        const parent = byId.get(current.parent_id)
        if (!parent) break
        current = parent
      }
      if (current.slug !== slug && !current.parent_id) {
        return resolveShopCategoryPage(current.slug, categories)
      }
    }
  }

  if (group) {
    const members = new Set(categorySlugGroupMembers(group))
    const groupRoots = roots.filter(c => members.has(c.slug)).slice().sort(compareRoots)
    if (groupRoots.length === 0) return null

    const canonicalRoot = groupRoots.find(c => c.slug === group.canonical)
    const heading =
      canonicalRoot?.name_ua ??
      (groupRoots.length > 1 ? group.title : groupRoots[0]!.name_ua)

    return {
      heading,
      canonicalSlug: group.canonical,
      roots: groupRoots,
      primary: canonicalRoot ?? groupRoots[0]!,
    }
  }

  if (!exact) return null

  return {
    heading: exact.name_ua,
    canonicalSlug: exact.slug,
    roots: [exact],
    primary: exact,
  }
}

/**
 * Hub / compact nav: collapse alias-group roots into one tile so we never
 * link to a slug that 404s after a merge redirect.
 */
export function getShopNavCategories(
  categories: Category[],
  occupiedIds?: Set<string> | null
): Category[] {
  const roots = getRootCategories(categories)
  const used = new Set<string>()
  const out: Category[] = []

  for (const root of roots) {
    if (used.has(root.id)) continue
    if (!isShopNavCategory(root, occupiedIds)) continue

    const group = findCategorySlugGroup(root.slug)
    if (!group) {
      out.push(root)
      continue
    }

    const members = new Set(categorySlugGroupMembers(group))
    const groupRoots = roots.filter(c => members.has(c.slug)).slice().sort(compareRoots)
    for (const member of groupRoots) used.add(member.id)

    const canonicalRoot = groupRoots.find(c => c.slug === group.canonical)
    if (canonicalRoot) {
      out.push(canonicalRoot)
    } else if (groupRoots.length === 1) {
      out.push(groupRoots[0]!)
    } else if (groupRoots.length > 1) {
      const first = groupRoots[0]!
      out.push({
        ...first,
        slug: group.canonical,
        name_ua: group.title,
        sort_order: Math.min(...groupRoots.map(c => c.sort_order)),
      })
    }
  }

  return out.sort(compareRoots)
}
