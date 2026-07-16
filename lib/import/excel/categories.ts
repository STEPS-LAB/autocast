import { slugifyName } from '@/lib/utils'
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
 * Matching is by (name_ua, parent_id = null) so we never attach to a YML subcategory
 * that happens to share the same label.
 */
export async function resolveExcelCategoryIds(
  supabase: SupabaseClient,
  sheetNames: string[]
): Promise<Map<string, string>> {
  const uniqueNames = [...new Set(sheetNames.map(n => n.trim()).filter(Boolean))]
  const map = new Map<string, string>()
  if (uniqueNames.length === 0) return map

  const { data: existingRows } = await supabase
    .from('categories')
    .select('id,name_ua,slug,parent_id,sort_order')
    .is('parent_id', null)

  const byName = new Map<string, { id: string; slug: string }>()
  const reservedSlugs = new Set<string>()
  let nextSort = 100

  for (const row of existingRows ?? []) {
    reservedSlugs.add(row.slug)
    byName.set(row.name_ua.trim().toLowerCase(), { id: row.id, slug: row.slug })
    if (typeof row.sort_order === 'number' && row.sort_order >= nextSort) {
      nextSort = row.sort_order + 1
    }
  }

  for (const sheetName of uniqueNames) {
    const key = sheetName.toLowerCase()
    const existing = byName.get(key)
    if (existing) {
      map.set(sheetName, existing.id)
      continue
    }

    const slug = await uniqueCategorySlug(supabase, sheetName, reservedSlugs)
    const sortOrder = nextSort
    nextSort += 1

    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({
        slug,
        name_ua: sheetName,
        parent_id: null,
        image_url: null,
        sort_order: sortOrder,
      })
      .select('id,name_ua,slug')
      .single()

    if (error) {
      const { data: retry } = await supabase
        .from('categories')
        .select('id,name_ua,slug')
        .eq('name_ua', sheetName)
        .is('parent_id', null)
        .maybeSingle()
      if (retry) {
        map.set(sheetName, retry.id)
        byName.set(key, { id: retry.id, slug: retry.slug })
      }
      continue
    }

    if (inserted) {
      map.set(sheetName, inserted.id)
      byName.set(key, { id: inserted.id, slug: inserted.slug })
    }
  }

  return map
}
