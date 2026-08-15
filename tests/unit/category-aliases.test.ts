import { describe, expect, it } from 'vitest'
import type { Category } from '@/types'
import {
  getShopNavCategories,
  isSameCategoryNavSlug,
  resolveShopCategoryPage,
} from '@/lib/shop/category-aliases'
import { resolveShopCategoryIdsForRoots } from '@/lib/shop/category-tree'

function cat(
  partial: Pick<Category, 'id' | 'slug' | 'name_ua'> & Partial<Category>
): Category {
  return {
    parent_id: null,
    image_url: null,
    sort_order: 0,
    ...partial,
  }
}

describe('resolveShopCategoryPage', () => {
  it('404s only when no live root can back the slug', () => {
    expect(resolveShopCategoryPage('parkuvalni-kamery-ta-radary', [])).toBeNull()
    expect(
      resolveShopCategoryPage('parkuvalni-kamery-ta-radary', [
        cat({ id: 'avtozvuk', slug: 'avtozvuk', name_ua: 'Автозвук' }),
      ])
    ).toBeNull()
  })

  it('serves the merged parking URL from leftover import roots', () => {
    const radars = cat({
      id: 'radars',
      slug: 'parkuvalni-radary',
      name_ua: 'Паркувальні радари',
      sort_order: 2,
    })
    const cameras = cat({
      id: 'cameras',
      slug: 'kamery-parkuvalni',
      name_ua: 'Камери паркувальні',
      sort_order: 1,
    })

    const resolved = resolveShopCategoryPage('parkuvalni-kamery-ta-radary', [
      radars,
      cameras,
    ])

    expect(resolved).not.toBeNull()
    expect(resolved?.canonicalSlug).toBe('parkuvalni-kamery-ta-radary')
    expect(resolved?.heading).toBe('Паркувальні камери та радари')
    expect(resolved?.roots.map(r => r.slug).sort()).toEqual([
      'kamery-parkuvalni',
      'parkuvalni-radary',
    ])
  })

  it('keeps a single leftover parking root under its own name', () => {
    const radars = cat({
      id: 'radars',
      slug: 'parkuvalni-radary',
      name_ua: 'Паркувальні радари',
    })
    const resolved = resolveShopCategoryPage('parkuvalni-radary', [radars])
    expect(resolved?.heading).toBe('Паркувальні радари')
    expect(resolved?.roots).toEqual([radars])
  })

  it('resolves a normal root by exact slug', () => {
    const audio = cat({ id: 'a', slug: 'avtozvuk', name_ua: 'Автозвук' })
    const resolved = resolveShopCategoryPage('avtozvuk', [audio])
    expect(resolved?.heading).toBe('Автозвук')
    expect(resolved?.roots).toEqual([audio])
  })
})

describe('getShopNavCategories', () => {
  it('collapses parking alias roots into one tile that points at the working URL', () => {
    const nav = getShopNavCategories([
      cat({
        id: 'cameras',
        slug: 'kamery-parkuvalni',
        name_ua: 'Камери паркувальні',
        sort_order: 1,
      }),
      cat({
        id: 'radars',
        slug: 'parkuvalni-radary',
        name_ua: 'Паркувальні радари',
        sort_order: 2,
      }),
      cat({ id: 'audio', slug: 'avtozvuk', name_ua: 'Автозвук', sort_order: 0 }),
    ])

    expect(nav.map(c => c.slug)).toEqual(['avtozvuk', 'parkuvalni-kamery-ta-radary'])
    expect(nav[1]?.name_ua).toBe('Паркувальні камери та радари')
  })

  it('does not invent a parking tile when those roots are absent', () => {
    const nav = getShopNavCategories([
      cat({ id: 'audio', slug: 'avtozvuk', name_ua: 'Автозвук' }),
    ])
    expect(nav.map(c => c.slug)).toEqual(['avtozvuk'])
  })
})

describe('isSameCategoryNavSlug', () => {
  it('treats parking aliases as the same nav item', () => {
    expect(
      isSameCategoryNavSlug('parkuvalni-radary', 'parkuvalni-kamery-ta-radary')
    ).toBe(true)
    expect(isSameCategoryNavSlug('avtozvuk', 'avtosvitlo')).toBe(false)
  })
})

describe('resolveShopCategoryIdsForRoots', () => {
  it('unions product category ids from every live root in the group', () => {
    const cameras = cat({
      id: 'cameras',
      slug: 'kamery-parkuvalni',
      name_ua: 'Камери паркувальні',
    })
    const radars = cat({
      id: 'radars',
      slug: 'parkuvalni-radary',
      name_ua: 'Паркувальні радари',
    })
    const child = cat({
      id: 'parktronics',
      slug: 'parktroniky',
      name_ua: 'Парктроніки',
      parent_id: 'radars',
    })

    const ids = resolveShopCategoryIdsForRoots(
      [cameras, radars, child],
      ['kamery-parkuvalni', 'parkuvalni-radary'],
      []
    )
    expect(ids.sort()).toEqual(['cameras', 'parktronics', 'radars'])
  })
})
