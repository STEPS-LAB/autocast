import type { SupabaseClient } from '@supabase/supabase-js'
import { slugifyName } from '@/lib/utils'
import { canonicalizeImportCategoryName } from './category-locale'
import {
  findBestCategoryMatch,
  type CategoryMatchCandidate,
} from './category-match'
import { buildCategoryImportPlan } from './category-tree'
import type { YmlCategory } from './types'

const CATEGORY_PAGE_SIZE = 1000

/** Paginated category fetch — no `server-only` (safe for CLI sync scripts). */
async function fetchAllCategories(
  supabase: SupabaseClient,
  select: string
): Promise<{ data: Array<Record<string, unknown>>; error: { message: string } | null }> {
  const rows: Array<Record<string, unknown>> = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('categories')
      .select(select)
      .order('sort_order', { ascending: true })
      .order('name_ua', { ascending: true })
      .range(from, from + CATEGORY_PAGE_SIZE - 1)
    if (error) return { data: [], error: { message: error.message } }
    const page = (data ?? []) as unknown as Array<Record<string, unknown>>
    rows.push(...page)
    if (page.length < CATEGORY_PAGE_SIZE) break
    from += CATEGORY_PAGE_SIZE
  }
  return { data: rows, error: null }
}

async function uniqueCategorySlug(
  supabase: SupabaseClient,
  baseName: string,
  reserved: Set<string>
): Promise<string> {
  const base = slugifyName(baseName, 'category')
  let candidate = base
  let suffix = 2

  while (true) {
    if (!reserved.has(candidate)) {
      reserved.add(candidate)
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!data) return candidate
    }
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

/**
 * Upsert the feed category tree (used leaves + ancestors) and return
 * feedCategoryId → dbCategoryId.
 *
 * Matching rule for every category/subcategory: if an equivalent name already
 * exists anywhere in the shop taxonomy, reuse it — do not create a duplicate.
 */
export async function importCategoryTree(
  supabase: SupabaseClient,
  categories: YmlCategory[],
  usedLeafIds: string[]
): Promise<Map<string, string>> {
  const plan = buildCategoryImportPlan(categories, usedLeafIds)
  const feedToDb = new Map<string, string>()
  if (plan.length === 0) return feedToDb

  const { data: existingRows, error: existingError } = await fetchAllCategories(
    supabase,
    'id,name_ua,slug,parent_id'
  )
  if (existingError) throw new Error(existingError.message)

  const matchCandidates: CategoryMatchCandidate[] = []
  const reservedSlugs = new Set<string>()
  for (const row of existingRows) {
    matchCandidates.push({
      id: String(row.id),
      nameUa: String(row.name_ua),
      parentId: (row.parent_id as string | null) ?? null,
      slug: String(row.slug),
    })
    reservedSlugs.add(String(row.slug))
  }

  for (const node of plan) {
    const parentDbId = node.parentFeedId ? (feedToDb.get(node.parentFeedId) ?? null) : null
    const nameUa = canonicalizeImportCategoryName(node.name)

    const existing =
      findBestCategoryMatch(nameUa, parentDbId, matchCandidates) ??
      (parentDbId != null ? findBestCategoryMatch(nameUa, null, matchCandidates) : null)

    if (existing) {
      feedToDb.set(node.feedId, existing.id)
      if (parentDbId && existing.parentId == null && node.parentFeedId != null) {
        const { error: reparentError } = await supabase
          .from('categories')
          .update({ parent_id: parentDbId })
          .eq('id', existing.id)
          .is('parent_id', null)
        if (!reparentError) {
          existing.parentId = parentDbId
          const idx = matchCandidates.findIndex(c => c.id === existing.id)
          if (idx >= 0) matchCandidates[idx] = { ...existing, parentId: parentDbId }
        }
      }
      continue
    }

    if (node.parentFeedId && !parentDbId) {
      continue
    }

    const slug = await uniqueCategorySlug(supabase, nameUa, reservedSlugs)
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({
        slug,
        name_ua: nameUa,
        parent_id: parentDbId,
        image_url: null,
        sort_order: node.sortOrder,
      })
      .select('id,name_ua,slug,parent_id')
      .single()

    if (error) {
      const { data: retryRows } = await supabase
        .from('categories')
        .select('id,name_ua,slug,parent_id')
        .eq('name_ua', nameUa)
        .limit(20)

      const retryMatch = findBestCategoryMatch(
        nameUa,
        parentDbId,
        (retryRows ?? []).map(row => ({
          id: row.id,
          nameUa: row.name_ua,
          parentId: row.parent_id ?? null,
          slug: row.slug,
        }))
      )

      if (retryMatch) {
        feedToDb.set(node.feedId, retryMatch.id)
        if (!matchCandidates.some(c => c.id === retryMatch.id)) {
          matchCandidates.push(retryMatch)
        }
      } else {
        const again = findBestCategoryMatch(nameUa, null, matchCandidates)
        if (again) feedToDb.set(node.feedId, again.id)
      }
      continue
    }

    if (inserted) {
      feedToDb.set(node.feedId, inserted.id)
      matchCandidates.push({
        id: inserted.id,
        nameUa: inserted.name_ua,
        parentId: inserted.parent_id ?? null,
        slug: inserted.slug,
      })
    }
  }

  return feedToDb
}

/** Ensure a named fallback category exists (never "Категорія N"). */
export async function ensureNamedCategory(
  supabase: SupabaseClient,
  name: string,
  cache: Map<string, string>,
  matchCandidates: CategoryMatchCandidate[]
): Promise<string | null> {
  const nameUa = canonicalizeImportCategoryName(name.trim() || 'Інше')
  const cacheKey = nameUa.toLowerCase()
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null

  const existingMatch = findBestCategoryMatch(nameUa, null, matchCandidates)
  if (existingMatch) {
    cache.set(cacheKey, existingMatch.id)
    return existingMatch.id
  }

  const { data: existingRows } = await supabase
    .from('categories')
    .select('id,name_ua,slug,parent_id')
    .limit(500)

  const fromDb = findBestCategoryMatch(
    nameUa,
    null,
    (existingRows ?? []).map(row => ({
      id: String(row.id),
      nameUa: String(row.name_ua),
      parentId: (row.parent_id as string | null) ?? null,
      slug: String(row.slug),
    }))
  )
  if (fromDb) {
    cache.set(cacheKey, fromDb.id)
    if (!matchCandidates.some(c => c.id === fromDb.id)) {
      matchCandidates.push(fromDb)
    }
    return fromDb.id
  }

  const slug = await uniqueCategorySlug(supabase, nameUa, new Set())
  const { data: inserted, error } = await supabase
    .from('categories')
    .insert({
      slug,
      name_ua: nameUa,
      parent_id: null,
      image_url: null,
      sort_order: 900,
    })
    .select('id,name_ua,slug,parent_id')
    .single()

  if (error || !inserted) return null
  cache.set(cacheKey, inserted.id)
  matchCandidates.push({
    id: inserted.id,
    nameUa: inserted.name_ua,
    parentId: inserted.parent_id ?? null,
    slug: inserted.slug,
  })
  return inserted.id
}
