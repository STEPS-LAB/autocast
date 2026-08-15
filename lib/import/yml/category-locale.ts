/**
 * Normalize feed category labels to Ukrainian and avoid creating Russian names.
 */

/** Parent category for car-care / chemistry leaves. */
export const CANONICAL_CAR_CARE_CATEGORY = 'Автохімія'

/** Labels that mean the parent «Автохімія», not a leaf. */
const CAR_CARE_PARENT_ALIASES = new Set(
  [
    'автохімія',
    'автохимия',
    'автодогляд',
    'хімія та косметика',
    'химия и косметика',
    'хімія',
    'химия',
  ].map(s => s.toLowerCase())
)

/**
 * Leaf labels under Автохімія → short shop subcategory names.
 * Keys are normalized lowercase Ukrainian (after RU→UA).
 */
const CAR_CARE_CHILD_CANONICAL: Record<string, string> = {
  ароматизатори: 'Ароматизатори',
  ароматизаторы: 'Ароматизатори',
  'віск та поліролі': 'Віск',
  'воск и полироли': 'Віск',
  віск: 'Віск',
  поліролі: 'Віск',
  очищувачі: 'Очисники',
  очистители: 'Очисники',
  'очищувачі скла': 'Очисники скла',
  'очистители стекла': 'Очисники скла',
  'шампуні та піна': 'Шампуні',
  'шампуни и пена': 'Шампуні',
  шампуні: 'Шампуні',
  шампуни: 'Шампуні',
  'для дисків': 'Для дисків',
  'для дисков': 'Для дисків',
  'для оббивки': 'Для оббивки',
  'для пластику, вінілу, гуми': 'Для пластику',
  'для пластику вінілу гуми': 'Для пластику',
  'для пластику': 'Для пластику',
  'для зовнішнього пластику': 'Для пластику',
  'для шин': 'Для шин',
  'для шкіри': 'Для шкіри',
  'для кожи': 'Для шкіри',
  кузов: 'Кузов',
  салон: 'Салон',
  скло: 'Скло',
  стекло: 'Скло',
  колеса: 'Колеса',
  інвентар: 'Інвентар',
  инвентарь: 'Інвентар',
  набори: 'Набори',
  наборы: 'Набори',
  'квік детейлери та захисні покриття': 'Захисні покриття',
  'квік детейлери': 'Захисні покриття',
  'розморожувачі замків': 'Розморожувачі замків',
  'размораживатели замков': 'Розморожувачі замків',
  'розморожувачі скла': 'Розморожувачі скла',
  'размораживатели стекла': 'Розморожувачі скла',
  омивачі: 'Омивачі',
  омыватели: 'Омивачі',
  антидощ: 'Антидощ',
  антидождь: 'Антидощ',
  антитуман: 'Антитуман',
  'підкапотний простір': 'Підкапотний простір',
  'подкапотное пространство': 'Підкапотний простір',
}

/** Common RU → UA replacements for shop category labels (longest keys first). */
const RU_TO_UA: Array<[string, string]> = [
  ['автомагнитолы', 'автомагнітоли'],
  ['магнитолы', 'магнітоли'],
  ['усилители звука', 'підсилювачі звуку'],
  ['усилители', 'підсилювачі'],
  ['сабвуферы', 'сабвуфери'],
  ['аудиопроцессоры', 'аудіопроцесори'],
  ['аксессуары', 'аксесуари'],
  ['кабели монтажные', 'кабелі монтажні'],
  ['кабели установочные', 'кабелі монтажні'],
  ['автосвет', 'автосвітло'],
  ['химия и косметика', 'хімія та косметика'],
  ['химия та косметика', 'хімія та косметика'],
  ['очистители стекла', 'очищувачі скла'],
  ['очистители', 'очищувачі'],
  ['шампуни и пена', 'шампуні та піна'],
  ['шампуни та піна', 'шампуні та піна'],
  ['воск и полироли', 'віск та поліролі'],
  ['для кожи', 'для шкіри'],
  ['для шин', 'для шин'],
  ['для дисков', 'для дисків'],
  ['ароматизаторы', 'ароматизатори'],
  ['размораживатели замков', 'розморожувачі замків'],
  ['размораживатели стекла', 'розморожувачі скла'],
  ['омыватели', 'омивачі'],
  ['антидождь', 'антидощ'],
  ['антитуман', 'антитуман'],
  ['подкапотное пространство', 'підкапотний простір'],
  ['наборы', 'набори'],
  ['кузов', 'кузов'],
  ['салон', 'салон'],
  ['стекло', 'скло'],
  ['колеса', 'колеса'],
  ['инвентарь', 'інвентар'],
  ['акустика', 'акустика'],
  ['динамики', 'динаміки'],
]

const RU_MARKERS = /[ыэъё]|ия\b|ие\b|ый\b|ая\b|ое\b|ые\b|ов\b|ей\b/i
const UA_MARKERS = /[ієїґ]/i

export function looksRussian(value: string): boolean {
  const text = value.trim()
  if (!text) return false
  if (UA_MARKERS.test(text)) return false
  if (!/[а-яА-Я]/.test(text)) return false
  return RU_MARKERS.test(text)
}

/** Apply known RU→UA phrase replacements (case-insensitive). */
export function translateCategoryToUkrainian(name: string): string {
  let result = name.trim()
  if (!result) return result

  const lower = result.toLowerCase()
  for (const [ru, ua] of RU_TO_UA) {
    if (lower === ru) {
      return capitalizeUa(ua)
    }
  }

  const sorted = [...RU_TO_UA].sort((a, b) => b[0].length - a[0].length)
  let replaced = false
  for (const [ru, ua] of sorted) {
    const re = new RegExp(escapeRegExp(ru), 'gi')
    if (re.test(result)) {
      result = result.replace(re, ua)
      replaced = true
    }
  }

  if (looksRussian(result)) {
    result = result
      .replace(/ы/g, 'и')
      .replace(/э/g, 'е')
      .replace(/ъ/g, '')
      .replace(/ё/g, 'е')
  }

  if (replaced || looksRussian(name)) {
    return capitalizeUa(result.trim())
  }
  return result.trim()
}

export function ensureUkrainianCategoryName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  return translateCategoryToUkrainian(trimmed)
}

function aliasKey(name: string): string {
  return ensureUkrainianCategoryName(name)
    .toLowerCase()
    .replace(/['’`ʹ]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const FALLBACK_NAME_RE = /^категорія\s+\d+$/i

/** Feed placeholders like «Категорія 167» must never appear in the shop. */
export function isPlaceholderCategoryName(name: string): boolean {
  return FALLBACK_NAME_RE.test(name.trim())
}

export function isCarCareParentName(name: string): boolean {
  const key = aliasKey(name)
  return CAR_CARE_PARENT_ALIASES.has(key) || key === 'автохімія'
}

export function isCarCareChildName(name: string): boolean {
  const key = aliasKey(name)
  if (!key || isCarCareParentName(name)) return false
  if (CAR_CARE_CHILD_CANONICAL[key]) return true
  if (key.includes('детейлер')) return true
  if (key.includes('захисн') && key.includes('покритт')) return true
  if (key.startsWith('для ') && /(диск|шин|шкір|кож|пластик|оббив|гуми|вініл)/.test(key)) {
    return true
  }
  // Already-canonical short child names
  return Object.values(CAR_CARE_CHILD_CANONICAL).some(v => aliasKey(v) === key)
}

/** @deprecated use isCarCareChildName / isCarCareParentName */
export function isCarCareCategoryName(name: string): boolean {
  return isCarCareParentName(name) || isCarCareChildName(name)
}

/**
 * UA normalize + map care parent aliases → Автохімія, care leaves → short
 * subcategory names (Шампуні, Очисники, Віск…). Does not flatten children
 * into the parent.
 */
export function canonicalizeImportCategoryName(name: string): string {
  const ua = ensureUkrainianCategoryName(name)
  if (!ua) return ua

  const key = aliasKey(ua)
  if (CAR_CARE_PARENT_ALIASES.has(key)) return CANONICAL_CAR_CARE_CATEGORY
  if (key === 'автомагнітоли та мультимедіа' || key === 'магнітоли та мультимедіа') {
    return 'Автомагнітоли'
  }

  const child = CAR_CARE_CHILD_CANONICAL[key]
  if (child) return child

  if (key.includes('детейлер') || (key.includes('захисн') && key.includes('покритт'))) {
    return 'Захисні покриття'
  }

  return ua
}

function capitalizeUa(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
