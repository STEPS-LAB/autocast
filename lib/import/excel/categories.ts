import { slugifyName } from '@/lib/utils'
import { canonicalizeImportCategoryName } from '@/lib/import/yml/category-locale'
import { findBestCategoryMatch } from '@/lib/import/yml/category-match'
import { fetchAllCategories } from '@/lib/data/categories'
import type { SupabaseClient } from '@supabase/supabase-js'

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
 * Ensure top-level categories exist for each Excel sheet name.
 * Reuses any existing equivalent category/subcategory by name — never duplicates.
 */
export async function resolveExcelCategoryIds(
  supabase: SupabaseClient,
  sheetNames: string[]
): Promise<Map<string, string>> {
  const uniqueNames = [...new Set(sheetNames.map(n => n.trim()).filter(Boolean))]
  const map = new Map<string, string>()
  if (uniqueNames.length === 0) return map

  const { data: existingRows, error } = await fetchAllCategories(
    supabase,
    'id,name_ua,slug,parent_id,sort_order'
  )
  if (error) throw new Error(error.message)

  const matchCandidates = (existingRows ?? []).map(row => ({
    id: String(row.id),
    nameUa: String(row.name_ua),
    parentId: (row.parent_id as string | null) ?? null,
    slug: String(row.slug),
  }))
  const reservedSlugs = new Set(matchCandidates.map(c => c.slug).filter(Boolean) as string[])
  let nextSort = 100

  for (const row of existingRows ?? []) {
    if (typeof row.sort_order === 'number' && row.sort_order >= nextSort) {
      nextSort = row.sort_order + 1
    }
  }

  for (const sheetName of uniqueNames) {
    const nameUa = canonicalizeImportCategoryName(sheetName)
    const existing = findBestCategoryMatch(nameUa, null, matchCandidates)
    if (existing) {
      map.set(sheetName, existing.id)
      continue
    }

    const slug = await uniqueCategorySlug(supabase, nameUa, reservedSlugs)
    const sortOrder = nextSort
    nextSort += 1

    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert({
        slug,
        name_ua: nameUa,
        parent_id: null,
        image_url: null,
        sort_order: sortOrder,
      })
      .select('id,name_ua,slug,parent_id')
      .single()

    if (insertError) {
      const retry = findBestCategoryMatch(nameUa, null, matchCandidates)
      if (retry) map.set(sheetName, retry.id)
      continue
    }

    if (inserted) {
      map.set(sheetName, inserted.id)
      matchCandidates.push({
        id: inserted.id,
        nameUa: inserted.name_ua,
        parentId: inserted.parent_id ?? null,
        slug: inserted.slug,
      })
    }
  }

  return map
}
