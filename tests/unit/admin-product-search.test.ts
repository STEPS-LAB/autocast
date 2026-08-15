import { describe, expect, it } from 'vitest'
import { planAdminProductSearch, sanitizeAdminProductSearch } from '@/lib/admin/product-search'

describe('admin product search', () => {
  it('keeps a pasted product title as AND-tokens on the name, not one huge phrase', () => {
    const plan = planAdminProductSearch(
      'Штатна магнітола Torssen NRJ-B1-BE Toyota Prado'
    )
    expect(plan?.expandRelations).toBe(false)
    expect(plan?.tokens).toEqual([
      'Штатна',
      'магнітола',
      'Torssen',
      'NRJ-B1-BE',
      'Toyota',
      'Prado',
    ])
  })

  it('expands brand/category only for a short single-token query', () => {
    const plan = planAdminProductSearch('Torssen')
    expect(plan).toEqual({ tokens: ['Torssen'], expandRelations: true })
  })

  it('strips LIKE wildcards', () => {
    expect(sanitizeAdminProductSearch('%foo_bar%')).toBe('foo bar')
  })

  it('ignores empty / too-short input', () => {
    expect(planAdminProductSearch('  ')).toBeNull()
    expect(planAdminProductSearch('a')).toBeNull()
  })
})
