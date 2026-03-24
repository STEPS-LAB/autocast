import type { SupabaseClient } from '@supabase/supabase-js'
import type { Brand } from '@/types'

/** Повертає brand_id для товару: існуючий за назвою або новий запис у brands. */
export async function resolveBrandId(
  supabase: SupabaseClient,
  knownBrands: Brand[],
  brandNameInput: string
): Promise<{ brandId: string | null; newBrand: Brand | null }> {
  const trimmed = brandNameInput.trim()
  if (!trimmed) return { brandId: null, newBrand: null }

  const existing = knownBrands.find(b => b.name.toLowerCase() === trimmed.toLowerCase())
  if (existing) return { brandId: existing.id, newBrand: null }

  const { data: inserted, error: insertError } = await supabase
    .from('brands')
    .insert({ name: trimmed, logo_url: null })
    .select('id,name,logo_url')
    .single()

  if (!insertError && inserted) {
    return { brandId: inserted.id, newBrand: inserted as Brand }
  }

  const { data: existingRow } = await supabase
    .from('brands')
    .select('id,name,logo_url')
    .eq('name', trimmed)
    .maybeSingle()

  if (existingRow) {
    return { brandId: existingRow.id, newBrand: existingRow as Brand }
  }

  throw new Error(insertError?.message ?? 'Не вдалося зберегти бренд')
}

export function mergeBrandIntoList(prev: Brand[], item: Brand): Brand[] {
  if (prev.some(b => b.id === item.id)) return prev
  return [...prev, item].sort((a, b) => a.name.localeCompare(b.name, 'uk'))
}
