import { describe, expect, it } from 'vitest'
import { dbPricingFromYmlOffer } from '@/lib/import/yml/pricing'
import { salePriceFromPercent } from '@/lib/discounts'
import { effectiveUnitPrice, resolveSalePricing } from '@/lib/utils'

describe('dbPricingFromYmlOffer', () => {
  it('maps price_old + price to list/sale', () => {
    expect(dbPricingFromYmlOffer({ price: 2893, oldPrice: 3616 })).toEqual({
      price: 3616,
      sale_price: 2893,
    })
  })

  it('clears sale when price_old is missing', () => {
    expect(dbPricingFromYmlOffer({ price: 1000, oldPrice: null })).toEqual({
      price: 1000,
      sale_price: null,
    })
  })

  it('ignores price_old that is not higher than price', () => {
    expect(dbPricingFromYmlOffer({ price: 1000, oldPrice: 900 })).toEqual({
      price: 1000,
      sale_price: null,
    })
  })
})

describe('resolveSalePricing / effectiveUnitPrice', () => {
  it('shows discount only when sale_price < price', () => {
    const pricing = resolveSalePricing(3616, 2893)
    expect(pricing.listPrice).toBe(3616)
    expect(pricing.salePrice).toBe(2893)
    expect(pricing.displayPrice).toBe(2893)
    expect(pricing.discountPercent).toBe(20)
    expect(effectiveUnitPrice(3616, 2893)).toBe(2893)
  })

  it('hides invalid sale_price >= price', () => {
    expect(resolveSalePricing(2893, 3616).salePrice).toBeNull()
    expect(effectiveUnitPrice(2893, 3616)).toBe(2893)
  })
})

describe('salePriceFromPercent', () => {
  it('keeps sale_price strictly below price', () => {
    const sale = salePriceFromPercent(100, 20)
    expect(sale).toBe(80)
    expect(sale).toBeLessThan(100)
  })
})
