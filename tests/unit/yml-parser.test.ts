import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  buildCategoryImportPlan,
  formatCategoryPath,
  resolveFeedCategoryIdAtMaxDepth,
} from '@/lib/import/yml/category-tree'
import { parseOfferXml, parseYmlStream, stripHtmlToText } from '@/lib/import/yml/parser'
import { resolveYmlFeedUrl } from '@/lib/import/yml/feeds'
import type { YmlCategory } from '@/lib/import/yml/types'
import { slugifyName } from '@/lib/utils'

const SAMPLE_YML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="2026-07-15 12:06">
<shop>
<categories>
<category id="17" >Автосвітло</category>
<category id="44"  parentId="17">LED лампи головного світла</category>
</categories>
<offers>
<offer id="614" available="true" >
<name>Світлодіодні лампи EXPERT H11 5900K (20200003)</name>
<vendorCode>20200003</vendorCode>
<url>https://example.com/product/20200003</url>
<currencyId>UAH</currencyId>
<categoryId>44</categoryId>
<price>2893</price>
<price_old>3616</price_old>
<picture>https://example.com/image/a.jpg</picture>
<picture>https://example.com/image/b.jpg</picture>
<vendor>ExampleBrand</vendor>
<description><![CDATA[<p>Опис ламп</p><p>• Потужність 55 W</p>]]></description>
<quantity_in_stock>4</quantity_in_stock>
<param name="Цоколь">H11</param>
</offer>
<offer id="612" available="false" >
<name>Немає в наявності</name>
<categoryId>44</categoryId>
<price>100</price>
<quantity_in_stock>0</quantity_in_stock>
</offer>
</offers>
</shop>
</yml_catalog>`

describe('YML / XML catalog parser', () => {
  it('strips HTML description to plain text', () => {
    expect(stripHtmlToText('<p>Абзац</p><p>• пункт</p>')).toContain('Абзац')
    expect(stripHtmlToText('<p>Абзац</p><p>• пункт</p>')).toContain('• пункт')
  })

  it('parses a single offer', () => {
    const categories = new Map<string, YmlCategory>([
      ['44', { id: '44', name: 'LED лампи', parentId: '17' }],
    ])
    const offerXml = SAMPLE_YML.slice(SAMPLE_YML.indexOf('<offer id="614"'), SAMPLE_YML.indexOf('</offer>') + 8)
    const { product, skipReason } = parseOfferXml(offerXml, categories)
    expect(skipReason).toBeNull()
    expect(product?.offerId).toBe('614')
    expect(product?.price).toBe(2893)
    expect(product?.oldPrice).toBe(3616)
    expect(product?.stock).toBe(4)
    expect(product?.pictures).toHaveLength(2)
    expect(product?.params['Цоколь']).toBe('H11')
    expect(product?.description).toContain('Опис ламп')
  })

  it('streams whole catalog and skips out of stock', async () => {
    const stream = Readable.from([SAMPLE_YML])
    const parsed = await parseYmlStream(stream)
    expect(parsed.totalOffers).toBe(2)
    expect(parsed.products).toHaveLength(1)
    expect(parsed.skippedOutOfStock).toBe(1)
    expect(parsed.products[0]?.offerId).toBe('614')
    expect(parsed.products[0]?.categoryName).toBe('LED лампи головного світла')
  })

  it('parses categories with extra attributes like rz_id', async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="54">Корінь</category>
<category id="111" rz_id="1" parentId="54">Дочірня з rz_id</category>
</categories>
<offers>
<offer id="1" available="true">
<name>Товар</name>
<categoryId>111</categoryId>
<price>10</price>
<quantity_in_stock>1</quantity_in_stock>
</offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    expect(parsed.categories).toHaveLength(2)
    expect(parsed.categories.find(c => c.id === '111')).toEqual({
      id: '111',
      name: 'Дочірня з rz_id',
      parentId: '54',
    })
    expect(parsed.products[0]?.categoryName).toBe('Дочірня з rz_id')
  })

  it('resolves public https XML URLs and blocks local hosts', () => {
    const resolved = resolveYmlFeedUrl({
      url: 'https://cdn.example.com/price/catalog.xml',
    })
    expect(resolved.url).toContain('cdn.example.com')
    expect(resolveYmlFeedUrl({ url: 'https://cdn.example.com/feed.xml' }).url).toContain(
      'cdn.example.com'
    )
    expect(() => resolveYmlFeedUrl({ url: 'http://example.com/a.xml' })).toThrow(/HTTPS/i)
    expect(() => resolveYmlFeedUrl({ url: 'https://localhost/a.xml' })).toThrow(/безпеки/i)
  })
})

describe('buildCategoryImportPlan', () => {
  const categories: YmlCategory[] = [
    { id: '17', name: 'Автосвітло', parentId: null },
    { id: '44', name: 'LED лампи головного світла', parentId: '17' },
    { id: '50', name: 'Невикористана гілка', parentId: null },
    { id: '51', name: 'Дочірня невикористана', parentId: '50' },
    { id: '9', name: 'Музика', parentId: null },
    { id: '10', name: 'Сабвуфери', parentId: '9' },
  ]

  it('includes used leaves and ancestors only, parents before children', () => {
    const plan = buildCategoryImportPlan(categories, ['44', '10'])
    expect(plan.map(n => n.feedId).sort()).toEqual(['10', '17', '44', '9'].sort())
    expect(plan.findIndex(n => n.feedId === '17')).toBeLessThan(plan.findIndex(n => n.feedId === '44'))
    expect(plan.findIndex(n => n.feedId === '9')).toBeLessThan(plan.findIndex(n => n.feedId === '10'))
    expect(plan.find(n => n.feedId === '44')?.parentFeedId).toBe('17')
    expect(plan.find(n => n.feedId === '10')?.parentFeedId).toBe('9')
    expect(plan.some(n => n.feedId === '50')).toBe(false)
    expect(plan.some(n => n.feedId === '51')).toBe(false)
  })

  it('assigns sort_order by sibling group', () => {
    const plan = buildCategoryImportPlan(categories, ['44', '10'])
    const roots = plan.filter(n => n.parentFeedId == null)
    expect(roots.every(n => n.sortOrder >= 200)).toBe(true)
    const child = plan.find(n => n.feedId === '44')
    expect(child?.sortOrder).toBe(1)
  })

  it('formats hierarchical preview paths', () => {
    expect(formatCategoryPath(categories, '44')).toBe('Автосвітло › LED лампи головного світла')
    expect(formatCategoryPath(categories, '17')).toBe('Автосвітло')
    expect(formatCategoryPath(categories, '999')).toBe('Категорія 999')
  })

  it('collapses deep feed leaves to max depth 1', () => {
    const deep: YmlCategory[] = [
      { id: '1', name: 'Мультимедіа', parentId: null },
      { id: '2', name: 'Штатні головні пристрої', parentId: '1' },
      { id: '3', name: 'Audi', parentId: '2' },
      { id: '4', name: 'A4', parentId: '3' },
      { id: '5', name: '2016', parentId: '4' },
    ]
    expect(resolveFeedCategoryIdAtMaxDepth(deep, '5', 1)).toBe('2')
    const plan = buildCategoryImportPlan(deep, ['5'], 1)
    expect(plan.map(n => n.feedId).sort()).toEqual(['1', '2'])
    expect(formatCategoryPath(deep, '5', 1)).toBe('Мультимедіа › Штатні головні пристрої')
  })
})

describe('slugifyName', () => {
  it('transliterates Ukrainian category names', () => {
    expect(slugifyName('Автосвітло')).toBe('avtosvitlo')
    expect(slugifyName('Музика')).toBe('muzyka')
    expect(slugifyName('LED лампи')).toContain('led')
  })
})
