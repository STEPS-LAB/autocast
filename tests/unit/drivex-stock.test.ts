import { describe, expect, it } from 'vitest'
import { parseDrivexStock } from '@/lib/import/drivex/stock'

describe('parseDrivexStock', () => {
  it('maps Багато to 100', () => {
    expect(parseDrivexStock('Багато')).toEqual({ stock: 100, label: 'Багато' })
  })

  it('maps Мало to 10', () => {
    expect(parseDrivexStock('Мало')).toEqual({ stock: 10, label: 'Мало' })
  })

  it('maps Немає and empty to 0', () => {
    expect(parseDrivexStock('Немає')).toEqual({ stock: 0, label: 'Немає' })
    expect(parseDrivexStock('-')).toEqual({ stock: 0, label: '-' })
    expect(parseDrivexStock(null)).toEqual({ stock: 0, label: null })
    expect(parseDrivexStock('')).toEqual({ stock: 0, label: null })
  })
})
