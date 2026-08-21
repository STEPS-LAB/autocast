import { slugifyName } from '@/lib/utils'
import { canonicalizeImportCategoryName } from './category-locale'
import { memoizeByString } from './memo'

/** Synonym groups: any member matches any other (after normalization). */
const SYNONYM_GROUPS: string[][] = [
  ['магнітоли', 'автомагнітоли', 'магнітола', 'автомагнітола', 'головні пристрої'],
  ['підсилювачі', 'підсилювачі звуку', 'підсилювач', 'усилители'],
  ['сабвуфери', 'сабвуфер'],
  ['акустика', 'автоакустика', 'динаміки'],
  ['аудіопроцесори', 'аудіо процесори', 'аудиопроцессоры'],
  ['автосвітло', 'автолампи', 'авто світло'],
  ['кабелі', 'кабелі монтажні', 'кабелі установчі', 'кабелі установочні'],
  ['аксесуари', 'аксесуари для автозвуку'],
  ['автозвук', 'авто звук', 'car audio'],
  ['автохімія', 'автодогляд', 'хімія та косметика', 'хімія'],
  ['шампуні', 'шампуні та піна', 'шампунь'],
  ['очисники', 'очищувачі'],
  ['віск', 'віск та поліролі', 'поліролі'],
  ['для пластику', 'для пластику вінілу гуми', 'для зовнішнього пластику'],
  ['захисні покриття', 'квік детейлери'],
]

const STOP_TOKENS = new Set([
  'та',
  'і',
  'й',
  'для',
  'з',
  'по',
  'the',
  'and',
  'of',
])

const normalizeCategoryKeyMemo = memoizeByString((name: string): string => {
  // Canonicalize first so шампуні / віск / ароматизатори → автохімія
  const canonical = canonicalizeImportCategoryName(name)
  return canonical
    .toLowerCase()
    .replace(/['’`ʹ]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    // Strip «авто» only for product types (магнітоли), keep Автохімія / Автозвук / Автодогляд.
    .replace(/\bавто(?!хімі|догляд|звук)(?=\p{L})/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
})

/** Hot path: called for both sides of every `categoryKeysEquivalent` check. */
export function normalizeCategoryKey(name: string): string {
  return normalizeCategoryKeyMemo(name)
}

const categorySlugKeyMemo = memoizeByString((name: string): string =>
  slugifyName(canonicalizeImportCategoryName(name), '')
)

export function categorySlugKey(name: string): string {
  return categorySlugKeyMemo(name)
}

function tokensOf(normalized: string): string[] {
  return normalized.split(' ').filter(t => t.length > 1 && !STOP_TOKENS.has(t))
}

function synonymCanonical(normalized: string): string | null {
  for (const group of SYNONYM_GROUPS) {
    const keys = group.map(g => normalizeCategoryKey(g))
    if (keys.includes(normalized)) return keys[0] ?? null
    for (const key of keys) {
      if (key.length >= 5 && (normalized === key || normalized.includes(key) || key.includes(normalized))) {
        const [shorter, longer] =
          normalized.length <= key.length ? [normalized, key] : [key, normalized]
        if (shorter.length / longer.length >= 0.65) return keys[0] ?? null
      }
    }
  }
  return null
}

export function categoryKeysEquivalent(a: string, b: string): boolean {
  const na = normalizeCategoryKey(a)
  const nb = normalizeCategoryKey(b)
  if (!na || !nb) return false
  if (na === nb) return true

  const slugA = categorySlugKey(a)
  const slugB = categorySlugKey(b)
  if (slugA && slugB && slugA === slugB) return true

  const sa = synonymCanonical(na)
  const sb = synonymCanonical(nb)
  if (sa && sb && sa === sb) return true

  // Strong containment only (магнітоли ⊂ автомагнітоли after normalize → usually equal already)
  if (na.length >= 5 && nb.length >= 5) {
    const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na]
    if (longer.includes(shorter) && shorter.length / longer.length >= 0.65) return true
  }

  const ta = new Set(tokensOf(na))
  const tb = new Set(tokensOf(nb))
  if (ta.size === 0 || tb.size === 0) return false
  let overlap = 0
  for (const t of ta) if (tb.has(t)) overlap += 1
  const union = new Set([...ta, ...tb]).size
  return union > 0 && overlap / union >= 0.7
}

export interface CategoryMatchCandidate {
  id: string
  nameUa: string
  parentId: string | null
  slug?: string | null
}

/**
 * Find an already-existing category for a feed/sheet label.
 * Rule: if an equivalent name (or slug) already exists anywhere in the tree,
 * reuse it — never create a duplicate. Prefer same parent when several match.
 */
export function findBestCategoryMatch(
  name: string,
  parentId: string | null,
  candidates: CategoryMatchCandidate[]
): CategoryMatchCandidate | null {
  const wantKey = normalizeCategoryKey(name)
  const wantSlug = categorySlugKey(name)
  if (!wantKey && !wantSlug) return null

  const exactParent: CategoryMatchCandidate[] = []
  const exactAny: CategoryMatchCandidate[] = []
  const fuzzyParent: CategoryMatchCandidate[] = []
  const fuzzyAny: CategoryMatchCandidate[] = []

  for (const candidate of candidates) {
    const sameParent = (candidate.parentId ?? null) === parentId
    const key = normalizeCategoryKey(candidate.nameUa)
    const slug = (candidate.slug?.trim() || categorySlugKey(candidate.nameUa)).toLowerCase()
    const exact = (wantKey && key === wantKey) || (wantSlug && slug === wantSlug)

    if (exact) {
      if (sameParent) exactParent.push(candidate)
      else exactAny.push(candidate)
      continue
    }

    if (!categoryKeysEquivalent(name, candidate.nameUa)) continue
    if (sameParent) fuzzyParent.push(candidate)
    else fuzzyAny.push(candidate)
  }

  if (exactParent[0]) return exactParent[0]

  if (exactAny.length > 0) {
    if (parentId == null) {
      return exactAny.find(c => c.parentId == null) ?? exactAny[0] ?? null
    }
    return exactAny.find(c => (c.parentId ?? null) === parentId) ?? exactAny[0] ?? null
  }

  if (fuzzyParent[0]) return fuzzyParent[0]

  if (fuzzyAny.length > 0) {
    if (parentId == null) {
      return fuzzyAny.find(c => c.parentId == null) ?? fuzzyAny[0] ?? null
    }
    return fuzzyAny[0] ?? null
  }

  return null
}
