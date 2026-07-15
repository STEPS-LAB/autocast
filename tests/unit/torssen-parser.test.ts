import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { parseOfferXml, parseTorssenYmlStream, stripHtmlToText } from '@/lib/import/torssen/parser'
import { resolveTorssenFeedUrl } from '@/lib/import/torssen/feeds'
import type { TorssenCategory } from '@/lib/import/torssen/types'

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
<name>Світлодіодні лампи TORSSEN EXPERT H11 5900K (20200003)</name>
<vendorCode>20200003</vendorCode>
<url>https://torssen.com/product/20200003</url>
<currencyId>UAH</currencyId>
<categoryId>44</categoryId>
<price>2893</price>
<price_old>3616</price_old>
<picture>https://torssen.com/image/catalog/goods/a.jpg</picture>
<picture>https://torssen.com/image/catalog/goods/b.jpg</picture>
<vendor>Torssen</vendor>
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

describe('torssen YML parser', () => {
  it('strips HTML description to plain text', () => {
    expect(stripHtmlToText('<p>Абзац</p><p>• пункт</p>')).toContain('Абзац')
    expect(stripHtmlToText('<p>Абзац</p><p>• пункт</p>')).toContain('• пункт')
  })

  it('parses a single offer', () => {
    const categories = new Map<string, TorssenCategory>([
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
    const parsed = await parseTorssenYmlStream(stream)
    expect(parsed.totalOffers).toBe(2)
    expect(parsed.products).toHaveLength(1)
    expect(parsed.skippedOutOfStock).toBe(1)
    expect(parsed.products[0]?.offerId).toBe('614')
    expect(parsed.products[0]?.categoryName).toBe('LED лампи головного світла')
  })

  it('resolves public https XML URLs and blocks local hosts', () => {
    const resolved = resolveTorssenFeedUrl({
      url: 'https://torssen.com/price/rozetka_html_ua.xml',
    })
    expect(resolved.url).toContain('rozetka_html_ua.xml')
    expect(resolveTorssenFeedUrl({ url: 'https://cdn.example.com/feed.xml' }).url).toContain(
      'cdn.example.com'
    )
    expect(() => resolveTorssenFeedUrl({ url: 'http://example.com/a.xml' })).toThrow(/HTTPS/i)
    expect(() => resolveTorssenFeedUrl({ url: 'https://localhost/a.xml' })).toThrow(/безпеки/i)
  })
})
