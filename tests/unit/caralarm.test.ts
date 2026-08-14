import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseCaralarmFromString,
  parseCaralarmOfferXml,
} from '@/lib/import/caralarm/parser'
import {
  EXPORT_FEED_DIALECT,
  MARKET_FEED_DIALECT,
} from '@/lib/import/caralarm/types'
import { retailUahFromOffer } from '@/lib/import/caralarm/pricing'
import {
  shouldKeepCaralarmOffer,
  stockFromCaralarmOffer,
} from '@/lib/import/caralarm/availability'
import {
  filterBlockedCategoryOffers,
  isBlockedCaralarmCategory,
} from '@/lib/import/caralarm/categories'
import {
  assertSafeToDelete,
  mergeMarketWithExport,
} from '@/lib/import/caralarm/sync'

const fixtures = resolve(process.cwd(), 'tests/fixtures/caralarm')

function load(name: string): string {
  return readFileSync(resolve(fixtures, name), 'utf8')
}

describe('caralarm parser dialects', () => {
  it('parses market feed with status available + kodTovara + categoryId', async () => {
    const parsed = await parseCaralarmFromString(load('market-synthetic.xml'), MARKET_FEED_DIALECT)
    expect(parsed.totalOffers).toBe(7)
    expect(parsed.categories.length).toBeGreaterThanOrEqual(6)

    const inStock = parsed.offers.find(o => o.offerId === '1001')
    expect(inStock?.availableStatus).toBe(1)
    expect(inStock?.available).toBe(true)
    expect(inStock?.productCode).toBe('CODE-1001')
    expect(inStock?.categoryId).toBe('90')
    expect(inStock?.priceMinUah).toBe(560)

    const supply = parsed.offers.find(o => o.offerId === '1002')
    expect(supply?.availableStatus).toBe(3)
    expect(supply?.available).toBe(true)
    expect(supply?.priceMinUsd).toBe(25)

    const oos = parsed.offers.find(o => o.offerId === '1003')
    expect(oos?.availableStatus).toBe(0)
    expect(oos?.available).toBe(false)
  })

  it('parses export feed with boolean available + model + categoryID + params', async () => {
    const parsed = await parseCaralarmFromString(load('export-synthetic.xml'), EXPORT_FEED_DIALECT)
    expect(parsed.offers).toHaveLength(2)

    const full = parsed.offers.find(o => o.offerId === '1001')
    expect(full?.availableStatus).toBeNull()
    expect(full?.available).toBe(true)
    expect(full?.productCode).toBe('CODE-1001')
    expect(full?.categoryId).toBe('90')
    expect(full?.pictures).toHaveLength(2)
    expect(full?.params['Тип']).toBe('Біометричний')
    expect(full?.description).toContain('Повний')
    expect(full?.descriptionShort).toContain('Короткий')

    const falseAvail = parsed.offers.find(o => o.offerId === '1002')
    expect(falseAvail?.available).toBe(false)
  })

  it('parses real sample snippets without throwing', async () => {
    const market = await parseCaralarmFromString(load('market-sample.xml'), MARKET_FEED_DIALECT)
    const exportFeed = await parseCaralarmFromString(
      load('export-sample.xml'),
      EXPORT_FEED_DIALECT
    )
    expect(market.offers.length).toBeGreaterThan(5)
    expect(exportFeed.offers.length).toBeGreaterThan(5)
    expect(market.categories.length).toBeGreaterThan(10)
  })
})

describe('caralarm pricing', () => {
  it('uses priceMinUAH when present', () => {
    expect(
      retailUahFromOffer({
        priceMinUah: 560,
        priceMinUsd: null,
        priceUah: 450,
        priceUsd: 10,
      })
    ).toBe(560)
  })

  it('falls back to priceMinUSD × (priceUAH/priceUSD)', () => {
    expect(
      retailUahFromOffer({
        priceMinUah: null,
        priceMinUsd: 25,
        priceUah: 900,
        priceUsd: 20,
      })
    ).toBe(1125)
  })

  it('returns null when no retail price', () => {
    expect(
      retailUahFromOffer({
        priceMinUah: null,
        priceMinUsd: null,
        priceUah: 540,
        priceUsd: 12,
      })
    ).toBeNull()
  })
})

describe('caralarm availability', () => {
  it('keeps status 1 and 3, drops 0 and 2', () => {
    expect(shouldKeepCaralarmOffer({ availableStatus: 1, available: true })).toBe(true)
    expect(shouldKeepCaralarmOffer({ availableStatus: 3, available: true })).toBe(true)
    expect(shouldKeepCaralarmOffer({ availableStatus: 0, available: false })).toBe(false)
    expect(shouldKeepCaralarmOffer({ availableStatus: 2, available: false })).toBe(false)
    expect(stockFromCaralarmOffer({ availableStatus: 3, available: true })).toBe(1)
    expect(stockFromCaralarmOffer({ availableStatus: 0, available: false })).toBe(0)
  })
})

describe('caralarm category blocklist', () => {
  it('blocks advertising and promo roots and their children', async () => {
    const parsed = await parseCaralarmFromString(load('market-synthetic.xml'), MARKET_FEED_DIALECT)
    expect(isBlockedCaralarmCategory(parsed.categories, '143')).toBe(true)
    expect(isBlockedCaralarmCategory(parsed.categories, '385')).toBe(true)
    expect(isBlockedCaralarmCategory(parsed.categories, '90')).toBe(false)

    const { kept, blocked } = filterBlockedCategoryOffers(parsed.categories, parsed.offers)
    expect(blocked).toBe(2)
    expect(kept.every(o => !['1006', '1007'].includes(o.offerId))).toBe(true)
  })
})

describe('caralarm merge + delete guards', () => {
  it('merges market availability with export content and filters correctly', async () => {
    const market = await parseCaralarmFromString(load('market-synthetic.xml'), MARKET_FEED_DIALECT)
    const exportFeed = await parseCaralarmFromString(
      load('export-synthetic.xml'),
      EXPORT_FEED_DIALECT
    )
    const exportById = new Map(exportFeed.offers.map(o => [o.offerId, o]))
    const { toKeep, skippedOos, skippedNoPrice, skippedBlocked } = mergeMarketWithExport(
      market.offers,
      exportById,
      market.categories
    )

    expect(skippedBlocked).toBe(2)
    expect(skippedOos).toBe(2) // 1003, 1004
    expect(skippedNoPrice).toBe(1) // 1005
    expect(toKeep.map(o => o.offerId).sort()).toEqual(['1001', '1002'])

    const first = toKeep.find(o => o.offerId === '1001')!
    expect(first.content.name).toContain('повний')
    expect(first.content.pictures).toHaveLength(2)
    expect(first.price).toBe(560)
    expect(first.stock).toBe(1)

    // Market status 3 kept even when export available=false
    const supply = toKeep.find(o => o.offerId === '1002')!
    expect(supply.stock).toBe(1)
    expect(supply.price).toBe(1125)
  })

  it('blocks mass delete on truncated feed or high delete ratio', () => {
    expect(
      assertSafeToDelete({ feedOfferCount: 100, existingCount: 100, deleteCount: 10 }).ok
    ).toBe(false)
    expect(
      assertSafeToDelete({ feedOfferCount: 9000, existingCount: 100, deleteCount: 50 }).ok
    ).toBe(false)
    expect(
      assertSafeToDelete({ feedOfferCount: 9000, existingCount: 100, deleteCount: 30 }).ok
    ).toBe(true)
  })

  it('parses a single offer xml with market dialect', () => {
    const xml = `<offer id="9" available="1"><name>X</name><priceUAH>1</priceUAH><priceMinUAH>2</priceMinUAH><kodTovara>K</kodTovara><categoryId>1</categoryId></offer>`
    const offer = parseCaralarmOfferXml(xml, new Map(), MARKET_FEED_DIALECT)
    expect(offer?.offerId).toBe('9')
    expect(offer?.productCode).toBe('K')
  })
})
