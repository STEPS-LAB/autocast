import { describe, expect, it } from 'vitest'
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  SHOP_PRODUCTS_PAGE_SIZE,
  clampPage,
  getTotalPages,
  paginateSlice,
  pageRangeLabel,
} from '@/lib/pagination'

describe('pagination', () => {
  it('splits admin items into pages of 10', () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1)
    expect(paginateSlice(items, 1, ADMIN_PRODUCTS_PAGE_SIZE)).toHaveLength(10)
    expect(paginateSlice(items, 2, ADMIN_PRODUCTS_PAGE_SIZE)).toHaveLength(10)
    expect(paginateSlice(items, 3, ADMIN_PRODUCTS_PAGE_SIZE)).toEqual([21, 22, 23, 24, 25])
  })

  it('splits shop items into pages of 12', () => {
    const items = Array.from({ length: 30 }, (_, index) => index + 1)
    expect(paginateSlice(items, 1, SHOP_PRODUCTS_PAGE_SIZE)).toHaveLength(12)
    expect(paginateSlice(items, 2, SHOP_PRODUCTS_PAGE_SIZE)).toHaveLength(12)
    expect(paginateSlice(items, 3, SHOP_PRODUCTS_PAGE_SIZE)).toEqual([25, 26, 27, 28, 29, 30])
  })

  it('calculates total pages and clamps page', () => {
    expect(getTotalPages(0, 10)).toBe(1)
    expect(getTotalPages(10, 10)).toBe(1)
    expect(getTotalPages(11, 10)).toBe(2)
    expect(getTotalPages(11, 0)).toBe(1)
    expect(getTotalPages(11, Number.NaN)).toBe(1)
    expect(clampPage(0, 3)).toBe(1)
    expect(clampPage(99, 3)).toBe(3)
    expect(clampPage(2, Number.NaN)).toBe(1)
  })

  it('formats page range label', () => {
    expect(pageRangeLabel(1, 12, 30)).toBe('1–12 з 30')
    expect(pageRangeLabel(3, 12, 30)).toBe('25–30 з 30')
  })
})
