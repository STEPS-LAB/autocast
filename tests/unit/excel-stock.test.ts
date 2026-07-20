import { describe, expect, it } from 'vitest'
import { parseExcelStock } from '@/lib/import/excel/stock'

describe('parseExcelStock', () => {
  it('maps textual stock labels', () => {
    expect(parseExcelStock('Багато')).toEqual({ stock: 100, label: 'Багато' })
  })

  it('maps low stock', () => {
    expect(parseExcelStock('Мало')).toEqual({ stock: 10, label: 'Мало' })
  })

  it('maps empty stock', () => {
    expect(parseExcelStock('Немає')).toEqual({ stock: 0, label: 'Немає' })
    expect(parseExcelStock('-')).toEqual({ stock: 0, label: '-' })
    expect(parseExcelStock(null)).toEqual({ stock: 0, label: null })
    expect(parseExcelStock('')).toEqual({ stock: 0, label: null })
  })

  it('parses numeric stock', () => {
    expect(parseExcelStock(12)).toEqual({ stock: 12, label: '12' })
    expect(parseExcelStock('3,5')).toEqual({ stock: 3, label: '3,5' })
  })
})
