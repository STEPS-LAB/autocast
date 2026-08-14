import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import {
  enrichMissingCategories,
  humanizeCategorySlug,
  categorySlugFromUrl,
} from '@/lib/import/yml/category-infer'
import { ensureUkrainianCategoryName, looksRussian, canonicalizeImportCategoryName } from '@/lib/import/yml/category-locale'
import { categoryKeysEquivalent, findBestCategoryMatch } from '@/lib/import/yml/category-match'
import {
  buildCategoryImportPlan,
  formatCategoryPath,
  resolveFeedCategoryIdAtMaxDepth,
} from '@/lib/import/yml/category-tree'
import {
  collectOfferPictures,
  decodeXmlEntities,
  parseOfferXml,
  parseYmlStream,
  stripHtmlToText,
} from '@/lib/import/yml/parser'
import { extractTextFromPdfBuffer } from '@/lib/import/yml/pdf-text'
import { resolveYmlFeedUrl } from '@/lib/import/yml/feeds'
import type { ParsedYmlOffer, YmlCategory } from '@/lib/import/yml/types'
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

  it('decodes double-escaped category names from OpenCart YML', () => {
    expect(decodeXmlEntities("Роз&apos;єми для магнітол 9&amp;quot;, 10.1&amp;quot;")).toBe(
      'Роз\'єми для магнітол 9", 10.1"'
    )
  })

  it('parses double-escaped category labels from the catalog section', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog>
<shop>
<categories>
<category id="1671" >Роз&apos;єми для магнітол 9&amp;quot;, 10.1&amp;quot;</category>
</categories>
<offers>
<offer id="1" available="true" >
<name>Тест</name>
<categoryId>1671</categoryId>
<price>100</price>
<quantity_in_stock>1</quantity_in_stock>
</offer>
</offers>
</shop>
</yml_catalog>`
    const result = await parseYmlStream(Readable.from([xml]))
    expect(result.categories.find(c => c.id === '1671')?.name).toBe('Роз\'єми для магнітол 9", 10.1"')
    expect(result.products[0]?.categoryName).toBe('Роз\'єми для магнітол 9", 10.1"')
  })

  it('parses a single offer', () => {
    const categories = new Map<string, YmlCategory>([
      ['44', { id: '44', name: 'LED лампи', parentId: '17', url: null }],
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

  it('maps feed discount into DB price/sale_price shape', async () => {
    const { dbPricingFromYmlOffer } = await import('@/lib/import/yml/pricing')
    expect(dbPricingFromYmlOffer({ price: 2893, oldPrice: 3616 })).toEqual({
      price: 3616,
      sale_price: 2893,
    })
  })

  it('skips DB update when product payload is unchanged', async () => {
    const { productNeedsUpdate, pricingNeedsUpdate } = await import(
      '@/lib/import/yml/product-diff'
    )
    const existing = {
      name_ua: 'Лампи',
      description_ua: 'Опис',
      price: '3616',
      sale_price: '2893',
      stock: '4',
      category_id: 'cat-1',
      brand_id: 'brand-1',
      specs: { 'Offer ID': '614', Цоколь: 'H11' },
      images: ['https://example.com/a.jpg'],
    }
    const next = {
      name_ua: 'Лампи',
      description_ua: 'Опис',
      price: 3616,
      sale_price: 2893,
      stock: 4,
      category_id: 'cat-1',
      brand_id: 'brand-1',
      specs: { 'Offer ID': '614', Цоколь: 'H11' },
      images: ['https://example.com/a.jpg'],
    }
    expect(productNeedsUpdate(existing, next)).toBe(false)
    expect(pricingNeedsUpdate(existing, next)).toBe(false)

    expect(
      productNeedsUpdate(existing, { ...next, price: 4000, sale_price: 3200 })
    ).toBe(true)
    expect(
      pricingNeedsUpdate(existing, { ...next, price: 4000, sale_price: 3200 })
    ).toBe(true)
    expect(productNeedsUpdate(existing, { ...next, stock: 1 })).toBe(true)
    expect(
      productNeedsUpdate(existing, {
        ...next,
        specs: { 'Offer ID': '614', Цоколь: 'H7' },
      })
    ).toBe(true)
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

  it('can parse without keeping products in memory', async () => {
    const seen: string[] = []
    const parsed = await parseYmlStream(Readable.from([SAMPLE_YML]), {
      collectProducts: false,
      onProduct: product => {
        seen.push(product.offerId)
      },
    })
    expect(parsed.products).toHaveLength(0)
    expect(seen).toEqual(['614'])
    expect(parsed.skippedOutOfStock).toBe(1)
    expect(parsed.categories.length).toBeGreaterThan(0)
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
      url: null,
    })
    expect(parsed.products[0]?.categoryName).toBe('Дочірня з rz_id')
  })

  it('collects image + additional_image_link and stock_quantity', async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="3" url="https://decibel.com.ua/category/akustika/">Акустика</category>
</categories>
<offers>
<offer id="9" available="true">
<name>Тест</name>
<categoryId>3</categoryId>
<price>100</price>
<stock_quantity>7</stock_quantity>
<picture>https://cdn.example.com/a.jpg</picture>
<image>https://cdn.example.com/a.jpg</image>
<additional_image_link>https://cdn.example.com/b.jpg</additional_image_link>
<additional_image_link>https://cdn.example.com/c.jpg</additional_image_link>
</offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    expect(parsed.products[0]?.stock).toBe(7)
    expect(parsed.products[0]?.pictures).toEqual([
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
      'https://cdn.example.com/c.jpg',
    ])
  })

  it(
    'nests head-unit, install BT, and car-audio leaves under shop parents',
    async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="61">Роз'єми для магнітол</category>
<category id="59">Перехідники ISO</category>
<category id="463">Перехідні рамки</category>
<category id="62">Адаптери кнопок керма</category>
<category id="460">Проставки для динаміків</category>
<category id="1497">Стельові монітори</category>
<category id="1594">Гучний зв'язок, Bluetooth адаптери</category>
<category id="900">Панель клімат контролю</category>
<category id="901">Датчики тиску в шинах</category>
<category id="902">Штатні камери</category>
</categories>
<offers>
<offer id="1" available="true"><name>Роз'єм</name><categoryId>61</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="2" available="true"><name>ISO</name><categoryId>59</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="3" available="true"><name>Рамка</name><categoryId>463</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="4" available="true"><name>Адаптер</name><categoryId>62</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="5" available="true"><name>Проставка</name><categoryId>460</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="6" available="true"><name>Монітор</name><categoryId>1497</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="7" available="true"><name>Bluetooth</name><categoryId>1594</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="8" available="true"><name>Клімат</name><categoryId>900</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="9" available="true"><name>TPMS</name><categoryId>901</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
<offer id="10" available="true"><name>Камера</name><categoryId>902</categoryId><price>10</price><stock_quantity>1</stock_quantity></offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    const labels = [
      ...new Set(parsed.products.map(p => formatCategoryPath(parsed.categories, p.categoryId))),
    ].sort((a, b) => a.localeCompare(b, 'uk'))
    expect(labels).toEqual([
      'Автоелектроніка › Адаптери кнопок керма',
      'Автоелектроніка › Датчики тиску в шинах',
      'Автоелектроніка › Перехідники ISO',
      'Автозвук › Проставки для динаміків',
      'Автомагнітоли › Перехідні рамки',
      "Автомагнітоли › Роз'єми для магнітол",
      'Автомагнітоли › Стельові монітори',
      "Все для монтажу › Гучний зв'язок, Bluetooth адаптери",
      'Мультимедіа › Панель клімат контролю',
      'Паркувальні камери та радари › Штатні камери',
    ])
  },
  15_000
  )

  it('nests car-care leaves under Автохімія', async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="149">Ароматизатори</category>
<category id="145">Віск та поліролі</category>
<category id="143">Очищувачі</category>
<category id="142">Шампуні та піна</category>
<category id="3">Акустика</category>
</categories>
<offers>
<offer id="1" available="true"><name>Аромат</name><categoryId>149</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="2" available="true"><name>Віск</name><categoryId>145</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="3" available="true"><name>Очисник</name><categoryId>143</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="4" available="true"><name>Шампунь</name><categoryId>142</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="5" available="true"><name>Динамік</name><categoryId>3</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    const labels = [
      ...new Set(parsed.products.map(p => formatCategoryPath(parsed.categories, p.categoryId))),
    ].sort((a, b) => a.localeCompare(b, 'uk'))
    expect(labels).toEqual([
      'Автозвук › Акустика',
      'Автохімія › Ароматизатори',
      'Автохімія › Віск',
      'Автохімія › Очисники',
      'Автохімія › Шампуні',
    ])
  })

  it('nests car-audio leaves under Автозвук', async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="3">Акустика</category>
<category id="120">Аудіопроцесори</category>
<category id="117">Підсилювачі звуку</category>
<category id="4">Сабвуфери</category>
<category id="132">Автосвітло</category>
</categories>
<offers>
<offer id="1" available="true"><name>А</name><categoryId>3</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="2" available="true"><name>Б</name><categoryId>120</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="3" available="true"><name>В</name><categoryId>117</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="4" available="true"><name>Г</name><categoryId>4</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
<offer id="5" available="true"><name>Д</name><categoryId>132</categoryId><price>10</price><stock_quantity>1</stock_quantity><picture>https://x/a.jpg</picture></offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    const labels = [
      ...new Set(parsed.products.map(p => formatCategoryPath(parsed.categories, p.categoryId))),
    ].sort((a, b) => a.localeCompare(b, 'uk'))
    expect(labels).toEqual([
      'Автозвук › Акустика',
      'Автозвук › Аудіопроцесори',
      'Автозвук › Підсилювачі звуку',
      'Автозвук › Сабвуфери',
      'Автосвітло',
    ])
    const plan = buildCategoryImportPlan(
      parsed.categories,
      parsed.products.map(p => p.categoryId)
    )
    expect(plan.some(n => n.name === 'Автозвук' && n.parentFeedId == null)).toBe(true)
    expect(plan.find(n => n.name === 'Акустика')?.parentFeedId).toBeTruthy()
  })

  it('infers missing category ids from image path instead of Категорія N', async () => {
    const xml = `<?xml version="1.0"?>
<yml_catalog><shop>
<categories>
<category id="150" url="https://decibel.com.ua/category/dlya-skiri/">Для шкіри</category>
<category id="147" url="https://decibel.com.ua/category/dlya-plastiku/">Для пластику, вінілу, гуми</category>
</categories>
<offers>
<offer id="167x" available="true">
<name>Набір для догляду за шкірою SWAG</name>
<categoryId>167</categoryId>
<price>100</price>
<stock_quantity>2</stock_quantity>
<picture>https://decibel.com.ua/file-manager/products/category-nabori/x/a.jpg</picture>
</offer>
<offer id="172x" available="true">
<name>Крем для пластику</name>
<categoryId>172</categoryId>
<price>100</price>
<stock_quantity>2</stock_quantity>
<picture>https://decibel.com.ua/file-manager/products/category-dlya-zovnisnyogo-plastiku/x/a.jpg</picture>
</offer>
</offers>
</shop></yml_catalog>`
    const parsed = await parseYmlStream(Readable.from([xml]))
    const labels = [
      ...new Set(parsed.products.map(p => formatCategoryPath(parsed.categories, p.categoryId))),
    ]
    expect(labels.some(l => /^Категорія\s+\d+$/i.test(l))).toBe(false)
    expect(parsed.products.find(p => p.offerId === '167x')?.categoryName).toBe('Набори')
    expect(parsed.products.find(p => p.offerId === '172x')?.categoryName).toBe('Для пластику')
    expect(
      formatCategoryPath(parsed.categories, parsed.products.find(p => p.offerId === '167x')!.categoryId)
    ).toBe('Автохімія › Набори')
  })

  it('collects PDF urls from offer params', () => {
    const offerXml = `<offer id="1" available="true">
<name>Товар</name><categoryId>1</categoryId><price>1</price><quantity_in_stock>1</quantity_in_stock>
<param name="Інструкція">https://cdn.example.com/manual.pdf</param>
</offer>`
    const { product } = parseOfferXml(offerXml, new Map())
    expect(product?.pdfUrls).toEqual(['https://cdn.example.com/manual.pdf'])
  })

  it('resolves public https XML/YML URLs and blocks local hosts', () => {
    const resolved = resolveYmlFeedUrl({
      url: 'https://cdn.example.com/price/catalog.xml',
    })
    expect(resolved.url).toContain('cdn.example.com')
    expect(resolveYmlFeedUrl({ url: 'https://cdn.example.com/feed.xml' }).url).toContain(
      'cdn.example.com'
    )
    expect(resolveYmlFeedUrl({ url: 'https://cdn.example.com/export/catalog.yml' }).url).toContain(
      'catalog.yml'
    )
    expect(
      resolveYmlFeedUrl({
        url: 'https://carav.com.ua/ua/index.php?route=feed/yandex_yml',
      }).feedId
    ).toBe('carav')
    expect(() => resolveYmlFeedUrl({ url: 'http://example.com/a.xml' })).toThrow(/HTTPS/i)
    expect(() => resolveYmlFeedUrl({ url: 'https://localhost/a.xml' })).toThrow(/безпеки/i)
    expect(() => resolveYmlFeedUrl({ url: 'https://cdn.example.com/page' })).toThrow(/xml|yml/i)
  })

  it('parses Carav-style offer with stock_quantity and escaped CDATA HTML', () => {
    const categories = new Map<string, YmlCategory>([
      ['463', { id: '463', name: 'Перехідні рамки', parentId: null, url: null }],
    ])
    const offerXml = `<offer id="954" available="true" >
<url>https://carav.com.ua/ua/product</url>
<price>740</price>
<currencyId>UAH</currencyId>
<categoryId>463</categoryId>
<picture>https://carav.com.ua/image/a.jpg</picture>
<stock_quantity>3</stock_quantity>
<name>Перехідна рамка Toyota</name>
<vendor>CARAV</vendor>
<vendorCode>07-002</vendorCode>
<description><![CDATA[&lt;p&gt;&lt;strong&gt;Рамка 2 DIN&lt;/strong&gt;&lt;/p&gt;]]></description>
<param name="Особенности">2 DIN</param>
</offer>`
    const { product, skipReason } = parseOfferXml(offerXml, categories)
    expect(skipReason).toBeNull()
    expect(product?.offerId).toBe('954')
    expect(product?.stock).toBe(3)
    expect(product?.vendorCode).toBe('07-002')
    expect(product?.description).toContain('Рамка 2 DIN')
    expect(product?.params['Особенности']).toBe('2 DIN')
  })
})

describe('category locale + matching', () => {
  it('detects and translates Russian category labels', () => {
    expect(looksRussian('Автомагнитолы')).toBe(true)
    expect(looksRussian('Автомагнітоли')).toBe(false)
    expect(ensureUkrainianCategoryName('Автомагнитолы')).toMatch(/магнітол/i)
    expect(ensureUkrainianCategoryName('Усилители звука')).toMatch(/підсилювач/i)
  })

  it('treats Магнітоли and Автомагнітоли as the same', () => {
    expect(categoryKeysEquivalent('Магнітоли', 'Автомагнітоли')).toBe(true)
    expect(categoryKeysEquivalent('Підсилювачі', 'Підсилювачі звуку')).toBe(true)
    const match = findBestCategoryMatch('Магнітоли', null, [
      { id: '1', nameUa: 'Автомагнітоли', parentId: null },
      { id: '2', nameUa: 'Акустика', parentId: null },
    ])
    expect(match?.id).toBe('1')
  })

  it('maps care leaves to short names under Автохімія parent (not flat)', () => {
    expect(canonicalizeImportCategoryName('Ароматизатори')).toBe('Ароматизатори')
    expect(canonicalizeImportCategoryName('Віск та поліролі')).toBe('Віск')
    expect(canonicalizeImportCategoryName('Очищувачі')).toBe('Очисники')
    expect(canonicalizeImportCategoryName('Шампуні та піна')).toBe('Шампуні')
    expect(canonicalizeImportCategoryName('Хімія та косметика')).toBe('Автохімія')
    expect(canonicalizeImportCategoryName('Акустика')).toBe('Акустика')
    expect(categoryKeysEquivalent('Шампуні та піна', 'Шампуні')).toBe(true)
  })

  it('humanizes decibel category slugs', () => {
    expect(categorySlugFromUrl('https://x/category-nabori/y.jpg')).toBe('nabori')
    expect(humanizeCategorySlug('nabori')).toMatch(/набори/i)
  })

  it('reuses existing category by name even under a different parent', () => {
    const match = findBestCategoryMatch('Акустика', 'parent-avtozvuk', [
      { id: 'flat', nameUa: 'Акустика', parentId: null },
      { id: 'other', nameUa: 'Сабвуфери', parentId: 'parent-avtozvuk' },
    ])
    expect(match?.id).toBe('flat')
  })

  it('reuses any existing shop category by name or slug (not only Автозвук)', () => {
    expect(
      findBestCategoryMatch('Автосвітло', null, [
        { id: '1', nameUa: 'Автосвітло', parentId: null, slug: 'avtosvitlo' },
      ])?.id
    ).toBe('1')
    expect(
      findBestCategoryMatch('Кабелі монтажні', 'new-parent', [
        { id: '2', nameUa: 'Кабелі монтажні', parentId: null, slug: 'kabeli-montazhni' },
      ])?.id
    ).toBe('2')
    expect(
      findBestCategoryMatch('Автохімія', null, [
        { id: '3', nameUa: 'Хімія та косметика', parentId: null, slug: 'himiya' },
      ])?.id
    ).toBe('3')
    expect(
      findBestCategoryMatch('Шампуні', null, [
        { id: '5', nameUa: 'Шампуні та піна', parentId: 'p', slug: 'sampuni' },
      ])?.id
    ).toBe('5')
    expect(
      findBestCategoryMatch('Магнітоли', null, [
        { id: '4', nameUa: 'Автомагнітоли', parentId: 'p', slug: 'avtomagnitoly' },
      ])?.id
    ).toBe('4')
  })
})

describe('buildCategoryImportPlan', () => {
  const categories: YmlCategory[] = [
    { id: '17', name: 'Автосвітло', parentId: null, url: null },
    { id: '44', name: 'LED лампи головного світла', parentId: '17', url: null },
    { id: '50', name: 'Невикористана гілка', parentId: null, url: null },
    { id: '51', name: 'Дочірня невикористана', parentId: '50', url: null },
    { id: '9', name: 'Музика', parentId: null, url: null },
    { id: '10', name: 'Сабвуфери', parentId: '9', url: null },
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
    expect(formatCategoryPath(categories, '999')).toBe('Інше')
  })

  it('collapses deep feed leaves to max depth 1', () => {
    const deep: YmlCategory[] = [
      { id: '1', name: 'Мультимедіа', parentId: null, url: null },
      { id: '2', name: 'Штатні головні пристрої', parentId: '1', url: null },
      { id: '3', name: 'Audi', parentId: '2', url: null },
      { id: '4', name: 'A4', parentId: '3', url: null },
      { id: '5', name: '2016', parentId: '4', url: null },
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

describe('pdf text extraction', () => {
  it('returns empty for non-pdf buffers', () => {
    expect(extractTextFromPdfBuffer(Buffer.from('hello'))).toBe('')
  })

  it('extracts literal strings from a minimal pdf', () => {
    // Minimal PDF with a text literal — enough for the best-effort extractor.
    const body =
      '%PDF-1.1\n' +
      '1 0 obj<<>>endobj\n' +
      'BT (Hello PDF Datasheet Manual Text) Tj ET\n' +
      '%%EOF\n'
    const text = extractTextFromPdfBuffer(Buffer.from(body, 'latin1'))
    expect(text.toLowerCase()).toContain('hello')
    expect(text.toLowerCase()).toContain('datasheet')
  })
})

describe('enrichMissingCategories', () => {
  it('remaps unknown plastic category onto existing plastic category', () => {
    const categories: YmlCategory[] = [
      {
        id: '147',
        name: 'Для пластику, вінілу, гуми',
        parentId: null,
        url: 'https://decibel.com.ua/category/dlya-plastiku/',
      },
    ]
    const products: ParsedYmlOffer[] = [
      {
        offerId: '1',
        available: true,
        name: 'Крем',
        vendorCode: null,
        vendor: null,
        categoryId: '172',
        categoryName: 'Категорія 172',
        price: 1,
        oldPrice: null,
        stock: 1,
        description: '',
        pictures: [
          'https://decibel.com.ua/file-manager/products/category-dlya-zovnisnyogo-plastiku/x.jpg',
        ],
        pdfUrls: [],
        params: {},
        url: null,
      },
    ]
    const result = enrichMissingCategories(categories, products)
    expect(result.products[0]?.categoryName).toBe('Для пластику')
    expect(
      formatCategoryPath(result.categories, result.products[0]!.categoryId)
    ).toBe('Автохімія › Для пластику')
  })
})

describe('collectOfferPictures', () => {
  it('dedupes picture and image tags', () => {
    const xml = `<picture>https://a/x.jpg</picture><image>https://a/x.jpg</image><additional_image_link>https://a/y.jpg</additional_image_link>`
    expect(collectOfferPictures(xml)).toEqual(['https://a/x.jpg', 'https://a/y.jpg'])
  })
})
