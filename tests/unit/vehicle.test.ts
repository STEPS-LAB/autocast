import { describe, expect, it } from 'vitest'
import {
  buildVehicleFacetsFromParsed,
  parseVehicle,
  vehicleFacetsForSelection,
} from '@/lib/shop/vehicle'

describe('parseVehicle', () => {
  it('extracts make, model and year from a typical product name', () => {
    const info = parseVehicle(
      'Штатна магнітола Torssen 2K Honda Odyssey 2018-2022 Android'
    )
    expect(info.make).toBe('Honda')
    expect(info.model).toBe('Odyssey')
    expect(info.year).toBe('2018–2022')
  })

  it('prefers multi-word makes (Land Rover)', () => {
    const info = parseVehicle('Магнітола Land Rover Discovery 2015-2019')
    expect(info.make).toBe('Land Rover')
    expect(info.model).toBe('Discovery')
  })

  it('normalises VW alias to Volkswagen', () => {
    expect(parseVehicle('Магнітола VW Golf 2013+').make).toBe('Volkswagen')
  })
})

describe('buildVehicleFacetsFromParsed', () => {
  const parsed = [
    { make: 'Honda', model: 'Accord', year: '2018–2022' },
    { make: 'Honda', model: 'Accord', year: '2013–2017' },
    { make: 'Honda', model: 'Civic', year: '2016–2021' },
    { make: 'Toyota', model: 'Camry', year: '2018+' },
  ]

  it('builds a full cascade tree in one pass', () => {
    const facets = buildVehicleFacetsFromParsed(parsed)
    expect(facets.makes.map(m => m.value)).toEqual(['Honda', 'Toyota'])
    expect(facets.cascade.Honda?.models.map(m => m.value)).toEqual([
      'Accord',
      'Civic',
    ])
    expect(facets.cascade.Honda?.yearsByModel.Accord?.map(y => y.value)).toEqual([
      '2013–2017',
      '2018–2022',
    ])
  })

  it('derives models/years instantly from cascade without re-parse', () => {
    const facets = buildVehicleFacetsFromParsed(parsed)
    const sliced = vehicleFacetsForSelection(facets, {
      make: 'Honda',
      model: 'Accord',
    })
    expect(sliced.models.map(m => m.value)).toEqual(['Accord', 'Civic'])
    expect(sliced.years.map(y => y.value)).toEqual(['2013–2017', '2018–2022'])
  })
})
