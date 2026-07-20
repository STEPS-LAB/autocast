import { describe, expect, it, vi } from 'vitest'
import { resolveExcelCategoryIds } from '@/lib/import/excel/categories'

type Row = {
  id: string
  name_ua: string
  slug: string
  parent_id: string | null
  sort_order: number
}

function createMockSupabase(seed: Row[] = []) {
  const rows = [...seed]
  let idCounter = 1

  function from(_table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let mode: 'select' | 'insert' = 'select'
    let insertPayload: Partial<Row> | null = null

    const builder: any = {
      select() {
        return builder
      },
      insert(payload: Partial<Row>) {
        mode = 'insert'
        insertPayload = payload
        return builder
      },
      is(column: keyof Row, value: null) {
        filters.push(row => row[column] === value)
        return builder
      },
      eq(column: keyof Row, value: string) {
        filters.push(row => row[column] === value)
        return builder
      },
      maybeSingle: async () => {
        const matched = rows.filter(row => filters.every(fn => fn(row)))
        return { data: matched[0] ?? null, error: null }
      },
      single: async () => {
        if (mode === 'insert' && insertPayload) {
          if (rows.some(r => r.slug === insertPayload!.slug)) {
            return { data: null, error: { message: 'duplicate slug' } }
          }
          const row: Row = {
            id: `new-${idCounter++}`,
            name_ua: String(insertPayload.name_ua),
            slug: String(insertPayload.slug),
            parent_id: (insertPayload.parent_id as string | null) ?? null,
            sort_order: Number(insertPayload.sort_order ?? 0),
          }
          rows.push(row)
          return { data: row, error: null }
        }
        const matched = rows.filter(row => filters.every(fn => fn(row)))
        return { data: matched[0] ?? null, error: matched[0] ? null : { message: 'not found' } }
      },
      then(resolve: (value: { data: Row[]; error: null }) => void) {
        // Awaitable select without maybeSingle/single
        const matched = rows.filter(row => filters.every(fn => fn(row)))
        return Promise.resolve(resolve({ data: matched, error: null }))
      },
    }

    return builder
  }

  return {
    from,
    _rows: rows,
  }
}

describe('resolveExcelCategoryIds', () => {
  it('creates top-level categories with readable slugs', async () => {
    const supabase = createMockSupabase()
    const map = await resolveExcelCategoryIds(supabase as any, ['Музика', 'Камери'])

    expect(map.get('Музика')).toBeTruthy()
    expect(map.get('Камери')).toBeTruthy()
    expect(supabase._rows).toHaveLength(2)
    expect(supabase._rows.every(r => r.parent_id === null)).toBe(true)
    expect(supabase._rows.find(r => r.name_ua === 'Музика')?.slug).toBe('muzyka')
    expect(supabase._rows.find(r => r.name_ua === 'Камери')?.slug).toBe('kamery')
  })

  it('reuses existing top-level category and ignores same-named subcategory', async () => {
    const supabase = createMockSupabase([
      {
        id: 'root-music',
        name_ua: 'Музика',
        slug: 'muzyka',
        parent_id: null,
        sort_order: 10,
      },
      {
        id: 'child-music',
        name_ua: 'Музика',
        slug: 'muzyka-child',
        parent_id: 'some-parent',
        sort_order: 1,
      },
    ])

    const map = await resolveExcelCategoryIds(supabase as any, ['Музика', 'Фари'])

    expect(map.get('Музика')).toBe('root-music')
    expect(map.get('Фари')).toBeTruthy()
    expect(map.get('Фари')).not.toBe('child-music')
    expect(supabase._rows.filter(r => r.name_ua === 'Фари' && r.parent_id === null)).toHaveLength(1)
  })

  it('avoids slug collision with existing subcategory slug', async () => {
    const supabase = createMockSupabase([
      {
        id: 'child',
        name_ua: 'Сабвуфери',
        slug: 'fary',
        parent_id: 'parent',
        sort_order: 1,
      },
    ])

    const map = await resolveExcelCategoryIds(supabase as any, ['Фари'])
    expect(map.get('Фари')).toBeTruthy()
    const created = supabase._rows.find(r => r.name_ua === 'Фари')
    expect(created?.slug).toBe('fary-2')
    expect(created?.parent_id).toBeNull()
  })
})
