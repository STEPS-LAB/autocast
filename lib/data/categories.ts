import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

export const CATEGORY_LIST_SELECT =
  'id,slug,name_ua,parent_id,image_url,sort_order' as const

/**
 * PostgREST caps each response at ~1000 rows. Fetch in pages so the full
 * category tree (roots + deep children) is available for admin UI.
 */
export async function fetchAllCategories<
  T extends Record<string, unknown> = {
    id: string
    slug: string
    name_ua: string
    parent_id: string | null
    image_url: string | null
    sort_order: number
  },
>(
  supabase: SupabaseClient,
  select: string = CATEGORY_LIST_SELECT
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('categories')
      .select(select)
      .order('sort_order', { ascending: true })
      .order('name_ua', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { data: [], error: { message: error.message } }
    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { data: rows, error: null }
}
