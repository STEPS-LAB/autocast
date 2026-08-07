import { canonicalizeImportCategoryName, ensureUkrainianCategoryName } from './category-locale'
import { categoryKeysEquivalent, findBestCategoryMatch, normalizeCategoryKey } from './category-match'
import { applyShopCategoryTaxonomy } from './category-taxonomy'
import type { ParsedYmlOffer, YmlCategory } from './types'

/** Latin slug fragment → Ukrainian word (Decibel / common UA translit). */
const SLUG_WORDS: Record<string, string> = {
  avtomagnitoly: 'автомагнітоли',
  magnitoly: 'магнітоли',
  akustika: 'акустика',
  sabvufery: 'сабвуфери',
  usiliteli: 'підсилювачі',
  audioprocessory: 'аудіопроцесори',
  aksessuary: 'аксесуари',
  kabeli: 'кабелі',
  ustanovocnye: 'монтажні',
  montazhni: 'монтажні',
  avtosvet: 'автосвітло',
  ximiya: 'хімія',
  kosmetika: 'косметика',
  kuzov: 'кузов',
  salon: 'салон',
  sklo: 'скло',
  kolesa: 'колеса',
  inventar: 'інвентар',
  sampuni: 'шампуні',
  pina: 'піна',
  ocishhuvaci: 'очищувачі',
  ochyshchuvachi: 'очищувачі',
  visk: 'віск',
  poliroli: 'поліролі',
  rozmorozuvaci: 'розморожувачі',
  zamkiv: 'замків',
  dlya: 'для',
  plastiku: 'пластику',
  vinilu: 'вінілу',
  gumi: 'гуми',
  obbivki: 'оббивки',
  aromatizatori: 'ароматизатори',
  skiri: 'шкіри',
  omivaci: 'омивачі',
  antidoshh: 'антидощ',
  antituman: 'антитуман',
  sin: 'шин',
  diskiv: 'дисків',
  pidkapotnii: 'підкапотний',
  prostir: 'простір',
  nabori: 'набори',
  nabory: 'набори',
  kvik: 'квік',
  deteileri: 'детейлери',
  zaxisni: 'захисні',
  pokrittya: 'покриття',
  zovnisnyogo: 'зовнішнього',
  ta: 'та',
}

const FALLBACK_NAME_RE = /^категорія\s+\d+$/i

export function isFallbackCategoryName(name: string): boolean {
  return FALLBACK_NAME_RE.test(name.trim())
}

/** Extract `/category-{slug}/` from product image or page URLs. */
export function categorySlugFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = /\/category-([a-z0-9-]+)\//i.exec(url)
  if (match?.[1]) return match[1].toLowerCase()
  const pathMatch = /\/category\/([a-z0-9-]+)\/?/i.exec(url)
  if (pathMatch?.[1]) return pathMatch[1].toLowerCase()
  return null
}

export function humanizeCategorySlug(slug: string): string {
  const parts = slug
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .map(part => SLUG_WORDS[part] ?? part)
  const joined = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (!joined) return ''
  return ensureUkrainianCategoryName(joined.charAt(0).toUpperCase() + joined.slice(1))
}

function inferNameFromOffer(product: ParsedYmlOffer): string | null {
  const urls = [...product.pictures, product.url ?? '']
  for (const url of urls) {
    const slug = categorySlugFromUrl(url)
    if (!slug) continue
    const name = humanizeCategorySlug(slug)
    if (name) return name
  }

  // Keyword fallback from product title
  const title = product.name.toLowerCase()
  const keywordMap: Array<[RegExp, string]> = [
    [/шкір/, 'Для шкіри'],
    [/кераміч|покритт.*кузов|кузов/, 'Кузов'],
    [/пластик|гум/, 'Для пластику, вінілу, гуми'],
    [/магнітол/, 'Автомагнітоли'],
    [/сабвуфер/, 'Сабвуфери'],
    [/підсилювач|усилител/, 'Підсилювачі звуку'],
    [/акустик|твітер|динамік/, 'Акустика'],
  ]
  for (const [re, name] of keywordMap) {
    if (re.test(title)) return name
  }
  return null
}

/**
 * Fill missing / empty feed categories referenced by offers using URL slugs
 * and product titles. Never leaves "Категорія N" as the only option when
 * we can infer a real Ukrainian label.
 */
export function enrichMissingCategories(
  categories: YmlCategory[],
  products: ParsedYmlOffer[]
): { categories: YmlCategory[]; products: ParsedYmlOffer[] } {
  const byId = new Map(categories.map(c => [c.id, { ...c }]))

  // Index known categories by URL slug for reuse
  const bySlug = new Map<string, YmlCategory>()
  for (const cat of byId.values()) {
    const slug = categorySlugFromUrl(cat.url) ?? null
    if (slug) bySlug.set(slug, cat)
    const nameKey = normalizeCategoryKey(cat.name)
    if (nameKey) bySlug.set(nameKey, cat)
  }

  const usedMissing = new Map<string, ParsedYmlOffer[]>()
  for (const product of products) {
    const existing = byId.get(product.categoryId)
    if (existing?.name?.trim() && !isFallbackCategoryName(existing.name)) continue
    const list = usedMissing.get(product.categoryId) ?? []
    list.push(product)
    usedMissing.set(product.categoryId, list)
  }

  const candidates = [...byId.values()].map(c => ({
    id: c.id,
    nameUa: c.name,
    parentId: c.parentId,
  }))

  for (const [feedId, offers] of usedMissing) {
    let inferred: string | null = null
    for (const offer of offers) {
      inferred = inferNameFromOffer(offer)
      if (inferred) break
    }
    if (!inferred) {
      inferred = `Інше`
    }
    inferred = canonicalizeImportCategoryName(inferred)

    // Prefer mapping onto an existing feed category with an equivalent name
    const matched = findBestCategoryMatch(inferred, null, candidates)
    if (matched && categoryKeysEquivalent(inferred, matched.nameUa)) {
      const target = byId.get(matched.id)
      if (target) {
        for (const offer of offers) {
          offer.categoryId = target.id
          offer.categoryName = target.name
        }
        continue
      }
    }

    // Also try slug map (e.g. category-dlya-plastiku → existing «Для пластику…»)
    const slug = offers.map(o => categorySlugFromUrl(o.pictures[0] ?? o.url)).find(Boolean)
    if (slug) {
      const fromSlug = bySlug.get(slug)
      if (fromSlug) {
        for (const offer of offers) {
          offer.categoryId = fromSlug.id
          offer.categoryName = fromSlug.name
        }
        continue
      }
      // Match humanized slug against existing names
      const human = humanizeCategorySlug(slug)
      const fuzzy = findBestCategoryMatch(human, null, candidates)
      if (fuzzy && categoryKeysEquivalent(human, fuzzy.nameUa)) {
        const target = byId.get(fuzzy.id)
        if (target) {
          for (const offer of offers) {
            offer.categoryId = target.id
            offer.categoryName = target.name
          }
          continue
        }
      }
    }

    byId.set(feedId, {
      id: feedId,
      name: inferred,
      parentId: null,
      url: null,
    })
    for (const offer of offers) {
      offer.categoryName = inferred
    }
    candidates.push({ id: feedId, nameUa: inferred, parentId: null })
  }

  // Normalize to Ukrainian; nest Автозвук / Автохімія via shop taxonomy
  for (const cat of byId.values()) {
    cat.name = canonicalizeImportCategoryName(cat.name)
  }

  const withTaxonomy = applyShopCategoryTaxonomy([...byId.values()])
  const collapsed = collapseEquivalentFeedCategories(withTaxonomy, products)

  return collapsed
}

/**
 * Merge feed categories that share the same canonical name + parent so the
 * import plan does not upsert the same leaf twice.
 */
function collapseEquivalentFeedCategories(
  categories: YmlCategory[],
  products: ParsedYmlOffer[]
): { categories: YmlCategory[]; products: ParsedYmlOffer[] } {
  const byId = new Map(categories.map(c => [c.id, { ...c }]))
  const canonicalToId = new Map<string, string>()
  const idRemap = new Map<string, string>()

  for (const cat of byId.values()) {
    const key = `${cat.parentId ?? 'null'}::${normalizeCategoryKey(cat.name)}`
    const existing = canonicalToId.get(key)
    if (!existing) {
      canonicalToId.set(key, cat.id)
      continue
    }
    idRemap.set(cat.id, existing)
    byId.delete(cat.id)
  }

  // Fix parent pointers if a remapped id was used as parent
  for (const cat of byId.values()) {
    if (cat.parentId && idRemap.has(cat.parentId)) {
      cat.parentId = idRemap.get(cat.parentId) ?? cat.parentId
    }
  }

  const nextProducts = products.map(product => {
    const categoryId = idRemap.get(product.categoryId) ?? product.categoryId
    const cat = byId.get(categoryId)
    return {
      ...product,
      categoryId,
      categoryName: cat?.name?.trim() || canonicalizeImportCategoryName(product.categoryName),
    }
  })

  return { categories: [...byId.values()], products: nextProducts }
}
