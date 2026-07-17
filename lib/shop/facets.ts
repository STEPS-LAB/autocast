import type { ProductCardWithSpecs } from '@/types'

/**
 * Spec-based faceted filtering for the shop.
 *
 * Product specs are free-form (`Record<string, string>`), so each facet knows
 * which spec keys to read and how to normalise the raw value into a canonical,
 * selectable option. Facet configs are declared per root category; a facet only
 * shows up when at least one product in the current view actually has a value
 * for it, so the sidebar stays relevant to whatever category is open.
 */

export type FacetType =
  | 'value'
  | 'multiValue'
  | 'boolean'
  | 'screenSize'
  | 'speakerSize'
  | 'resolution'
  | 'angle'
  | 'colorTemp'
  | 'din'

export interface FacetConfig {
  /** URL query-param key (must not collide with base shop params). */
  key: string
  label: string
  /** Spec keys to inspect, in priority order. */
  specKeys: string[]
  type: FacetType
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface Facet {
  key: string
  label: string
  type: FacetType
  options: FacetOption[]
}

export interface FacetSelections {
  [facetKey: string]: string[]
}

/** Base shop params that must never be treated as facet keys. */
const RESERVED_PARAMS = new Set([
  'q',
  'category',
  'brand',
  'minPrice',
  'maxPrice',
  'inStock',
  'sort',
  'page',
])

const BOOLEAN_YES = 'yes'

const MULTIMEDIA_FACETS: FacetConfig[] = [
  { key: 'din', label: 'Тип магнітоли', specKeys: ['Тип'], type: 'din' },
  {
    key: 'screen',
    label: 'Розмір екрана',
    specKeys: ['Діагональ екрану', 'Діагональ екрана', 'Розмір екрану', 'Розмір екрана', 'Екран', 'Діагональ'],
    type: 'screenSize',
  },
  {
    key: 'res',
    label: 'Роздільна здатність екрана',
    specKeys: [
      'Роздільна здатність дисплея',
      'Роздільна здатність екрану',
      'Роздільна здатність екрана',
      'Роздільна здатність',
    ],
    type: 'resolution',
  },
  {
    key: 'screentype',
    label: 'Тип екрана',
    specKeys: ['Тип екрану', 'Тип екрана', 'Тип дисплея'],
    type: 'value',
  },
  {
    key: 'os',
    label: 'Операційна система',
    specKeys: ['Операційна система', 'ОС'],
    type: 'value',
  },
  {
    key: 'ram',
    label: 'Оперативна памʼять',
    specKeys: ['Оперативна пам\'ять RAM', 'Оперативна памʼять RAM', 'RAM'],
    type: 'value',
  },
  {
    key: 'rom',
    label: 'Вбудована памʼять',
    specKeys: ['Вбудована пам\'ять ROM', 'Вбудована памʼять ROM', 'ROM'],
    type: 'value',
  },
  {
    key: 'carmake',
    label: 'Марка автомобіля',
    specKeys: ['Марка автомобіля', 'Сумісні марки автомобілів'],
    type: 'value',
  },
  { key: 'nav', label: 'Навігація', specKeys: ['Навігація', 'Підтримка навігації', 'GPS'], type: 'boolean' },
  { key: 'carplay', label: 'Apple CarPlay', specKeys: ['Carplay', 'CarPlay', 'Apple CarPlay'], type: 'boolean' },
  { key: 'androidauto', label: 'Android Auto', specKeys: ['Android Auto'], type: 'boolean' },
  { key: 'bt', label: 'Bluetooth', specKeys: ['Bluetooth', 'Підтримка Bluetooth'], type: 'boolean' },
  { key: 'wifi', label: 'Wi-Fi', specKeys: ['Wi-Fi', 'WiFi'], type: 'boolean' },
  { key: 'lte', label: '4G інтернет', specKeys: ['4G інтернет', '4G LTE'], type: 'boolean' },
]

const CAMERA_FACETS: FacetConfig[] = [
  {
    key: 'angle',
    label: 'Кут огляду',
    specKeys: ['Кут огляду', 'Угол обзора', 'Огляд'],
    type: 'angle',
  },
  {
    key: 'res',
    label: 'Роздільна здатність',
    specKeys: [
      'Роздільна здатність відео',
      'Роздільна здатність матриці',
      'Роздільна здатність дисплея',
      'Розширення',
    ],
    type: 'resolution',
  },
  {
    key: 'sensor',
    label: 'Сенсор / матриця',
    specKeys: ['Сенсор', 'Матриця'],
    type: 'value',
  },
  {
    key: 'mount',
    label: 'Місце установки',
    specKeys: ['Місце установки', 'Місце встановлення'],
    type: 'value',
  },
  {
    key: 'connector',
    label: 'Тип розʼєму',
    specKeys: ['Тип роз\'єму', 'Тип розʼєму'],
    type: 'value',
  },
  {
    key: 'camtype',
    label: 'Тип камери',
    specKeys: ['Тип камери', 'Тип кріплення камери'],
    type: 'value',
  },
  {
    key: 'ip',
    label: 'Ступінь захисту',
    specKeys: ['Ступінь захисту', 'Клас вологозахисту', 'Клас захисту'],
    type: 'value',
  },
  {
    key: 'carmake',
    label: 'Марка автомобіля',
    specKeys: ['Марка автомобіля'],
    type: 'value',
  },
]

const FACETS_BY_ROOT: Record<string, FacetConfig[]> = {
  /** Head units / Android multimedia — largest catalog. */
  multymedia: MULTIMEDIA_FACETS,

  /** Speakers, amps, subwoofers. */
  avtozvuk: [
    { key: 'type', label: 'Тип', specKeys: ['Тип'], type: 'value' },
    {
      key: 'size',
      label: 'Типорозмір',
      specKeys: ['Типорозмір'],
      type: 'speakerSize',
    },
    {
      key: 'sensitivity',
      label: 'Чутливість',
      specKeys: ['Чутливість (SPL)', 'Чутливість'],
      type: 'value',
    },
    {
      key: 'magnet',
      label: 'Матеріал магніту',
      specKeys: ['Матеріал магніту'],
      type: 'value',
    },
    {
      key: 'power',
      label: 'Номінальна потужність',
      specKeys: ['Номінальна потужність (RMS)', 'Потужність RMS 4 Ом (14.4 В)', 'Потужність'],
      type: 'value',
    },
    {
      key: 'cone',
      label: 'Матеріал дифузора',
      specKeys: ['Матеріал дифузора НЧ', 'Матеріал дифузора'],
      type: 'value',
    },
    {
      key: 'ampclass',
      label: 'Клас підсилювача',
      specKeys: ['Клас підсилювача'],
      type: 'value',
    },
    {
      key: 'channels',
      label: 'Кількість каналів',
      specKeys: ['Кількість каналів'],
      type: 'value',
    },
  ],

  avtosvitlo: [
    { key: 'kind', label: 'Вид', specKeys: ['Вид'], type: 'value' },
    { key: 'socket', label: 'Цоколь', specKeys: ['Цоколь', 'Тип лампи'], type: 'value' },
    {
      key: 'temp',
      label: 'Кольорова температура',
      specKeys: ['Кольорова температура', 'Температура', 'Колірна температура'],
      type: 'colorTemp',
    },
    {
      key: 'power',
      label: 'Потужність',
      specKeys: ['Потужність', 'Споживана потужність'],
      type: 'value',
    },
    {
      key: 'voltage',
      label: 'Напруга',
      specKeys: ['Напруга', 'Напруга живлення, В'],
      type: 'value',
    },
    {
      key: 'lumen',
      label: 'Світловий потік',
      specKeys: ['Світловий потік', 'Світлова температура'],
      type: 'value',
    },
    {
      key: 'purpose',
      label: 'Призначення',
      specKeys: ['Призначення'],
      type: 'value',
    },
    { key: 'canbus', label: 'CANBUS', specKeys: ['CANBUS', 'CAN'], type: 'boolean' },
  ],

  videoreyestratory: [
    {
      key: 'res',
      label: 'Роздільна здатність відео',
      specKeys: ['Роздільна здатність відео', 'Роздільна здатність'],
      type: 'resolution',
    },
    {
      key: 'angle',
      label: 'Кут огляду',
      specKeys: ['Кут огляду', 'Угол обзора'],
      type: 'angle',
    },
    {
      key: 'iface',
      label: 'Інтерфейси',
      specKeys: ['Інтерфейси'],
      type: 'multiValue',
    },
    {
      key: 'bt',
      label: 'Bluetooth',
      specKeys: ['Bluetooth'],
      type: 'value',
    },
    {
      key: 'fps',
      label: 'Частота кадрів',
      specKeys: ['Частота кадрів'],
      type: 'value',
    },
    {
      key: 'cpu',
      label: 'Процесор',
      specKeys: ['Процесор'],
      type: 'value',
    },
    {
      key: 'power',
      label: 'Живлення',
      specKeys: ['Питание', 'Живлення'],
      type: 'value',
    },
  ],

  'kamery-parkuvalni': CAMERA_FACETS,
  /** Catalog currently stores many OEM cameras under this root. */
  'parkuvalni-radary': [
    ...CAMERA_FACETS,
    {
      key: 'sensors',
      label: 'Кількість датчиків',
      specKeys: ['Кількість датчиків'],
      type: 'value',
    },
    {
      key: 'alert',
      label: 'Оповіщення',
      specKeys: ['Оповіщення'],
      type: 'value',
    },
  ],

  avtoelektronika: [
    {
      key: 'screen',
      label: 'Розмір екрана',
      specKeys: ['Екран', 'Діагональ', 'Діагональ екрану'],
      type: 'screenSize',
    },
    {
      key: 'res',
      label: 'Роздільна здатність',
      specKeys: ['Роздільна здатність', 'Роздільна здатність відео', 'Роздільність'],
      type: 'resolution',
    },
    {
      key: 'angle',
      label: 'Кут огляду',
      specKeys: ['Кут огляду', 'Угол обзора'],
      type: 'angle',
    },
    { key: 'gps', label: 'GPS', specKeys: ['GPS'], type: 'boolean' },
    { key: 'bt', label: 'Bluetooth', specKeys: ['Bluetooth'], type: 'boolean' },
    {
      key: 'iface',
      label: 'Інтерфейси',
      specKeys: ['Інтерфейси'],
      type: 'multiValue',
    },
  ],

  'zakhyst-vid-uhonu': [
    { key: 'sectype', label: 'Тип', specKeys: ['Тип', 'Тип захисту'], type: 'value' },
    { key: 'autostart', label: 'Автозапуск', specKeys: ['Автозапуск'], type: 'boolean' },
    { key: 'gsm', label: 'GSM', specKeys: ['GSM'], type: 'boolean' },
    { key: 'gps', label: 'GPS', specKeys: ['GPS'], type: 'boolean' },
    {
      key: 'app',
      label: 'Керування зі смартфона',
      specKeys: ['Мобільний додаток', 'Мобільний застосунок'],
      type: 'boolean',
    },
  ],

  'okhoronni-systemy': [
    { key: 'type', label: 'Тип', specKeys: ['Тип'], type: 'value' },
    {
      key: 'power',
      label: 'Живлення',
      specKeys: ['Питание', 'Живлення', 'Напруга'],
      type: 'value',
    },
  ],

  'rezervne-zhyvlennya': [
    { key: 'type', label: 'Тип', specKeys: ['Тип'], type: 'value' },
    { key: 'class', label: 'Клас', specKeys: ['Клас'], type: 'value' },
    {
      key: 'outpower',
      label: 'Вихідна потужність',
      specKeys: ['Вихідна потужність'],
      type: 'value',
    },
    {
      key: 'voltage',
      label: 'Напруга',
      specKeys: ['Напруга, в', 'Напруга акумуляторної батареї, В'],
      type: 'value',
    },
  ],
}

export function getFacetConfigs(rootSlug: string | null | undefined): FacetConfig[] {
  if (!rootSlug) return []
  return FACETS_BY_ROOT[rootSlug] ?? []
}

const NEGATIVE_VALUE = /^(ні|нi|нет|no|none|false|-|–|—|немає|немае|відсутн|0)$/i

function readSpec(specs: Record<string, string>, specKeys: string[]): string | undefined {
  for (const key of specKeys) {
    const raw = specs[key]
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim()
  }
  return undefined
}

function isTruthy(value: string): boolean {
  return !NEGATIVE_VALUE.test(value.trim())
}

/** Extract a screen size like `7"`, `9"`, `10"` from a raw spec value. */
function extractScreenSize(raw: string): string | null {
  const match = raw.match(
    /(\d+(?:[.,]\d+)?)\s*(?:"|”|''|``|′′|дюйм(?:а|ів|и)?|inch|in\b)/i
  )
  if (!match?.[1]) return null
  const value = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(value)) return null
  return `${value}"`
}

/** Speaker size: `8" (20 см)`, `5,25`` (13 см)`, `6x9`. */
function extractSpeakerSize(raw: string): string | null {
  const oval = raw.match(/(\d+)\s*[xх×]\s*(\d+)/i)
  if (oval && /оваль|6\s*[xх×]\s*9/i.test(raw)) {
    return `${oval[1]}×${oval[2]}`
  }
  const size = extractScreenSize(raw)
  if (size) return size
  const cm = raw.match(/(\d+(?:[.,]\d+)?)\s*см/i)
  if (cm?.[1]) return `${cm[1].replace(',', '.')} см`
  return null
}

const RESOLUTION_TOKENS = ['4K', '2K', 'UHD', 'QHD', 'FHD', 'HD', 'WVGA', 'WXGA', 'QVGA', 'WQVGA']

/** Extract a resolution like `1024×600`, `4K`, `WVGA` from a raw spec value. */
function extractResolution(raw: string): string | null {
  const dims = raw.match(/(\d{3,4})\s*[x×хХ*]\s*(\d{3,4})/)
  if (dims) return `${dims[1]}×${dims[2]}`
  const upper = raw.toUpperCase()
  for (const token of RESOLUTION_TOKENS) {
    const re = new RegExp(`(^|[^A-Z0-9])${token}([^A-Z0-9]|$)`)
    if (re.test(upper)) return token
  }
  return null
}

function extractDin(raw: string): string | null {
  const normalized = raw.toLowerCase().replace(/\s+/g, '')
  if (/(^|[^0-9])1din([^0-9]|$)/.test(normalized) || normalized === '1din') return '1 DIN'
  if (/(^|[^0-9])2din([^0-9]|$)/.test(normalized) || normalized === '2din') return '2 DIN'
  return null
}

/** Viewing angle: `140°`, `170˚`, take the largest number when ranges are given. */
function extractAngle(raw: string): string | null {
  const matches = [...raw.matchAll(/(\d{2,3})\s*[°˚º]/g)]
  if (matches.length === 0) {
    const plain = raw.match(/\b(\d{2,3})\b/)
    if (!plain?.[1]) return null
    const n = Number(plain[1])
    if (n < 60 || n > 360) return null
    return `${n}°`
  }
  const max = Math.max(...matches.map(m => Number(m[1])))
  if (!Number.isFinite(max)) return null
  return `${max}°`
}

function extractColorTemp(raw: string): string | null {
  const match = raw.match(/(\d{3,5})\s*[kк]/i)
  if (!match?.[1]) return null
  return `${match[1]}K`
}

function normalizeValueLabel(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/Ферріт|Феріт/gi, 'Ферит')
    .replace(/Гумова/gi, 'Гума')
    .trim()
}

function splitMultiValues(raw: string): string[] {
  return raw
    .split(/[,;|/]+/)
    .map(part => normalizeValueLabel(part))
    .filter(Boolean)
}

/** Canonical facet values a single product contributes to a given facet. */
function extractFacetValues(config: FacetConfig, specs: Record<string, string>): string[] {
  const raw = readSpec(specs, config.specKeys)
  if (!raw) return []

  switch (config.type) {
    case 'boolean':
      return isTruthy(raw) ? [BOOLEAN_YES] : []
    case 'screenSize': {
      const size = extractScreenSize(raw)
      return size ? [size] : []
    }
    case 'speakerSize': {
      const size = extractSpeakerSize(raw)
      return size ? [size] : []
    }
    case 'resolution': {
      const res = extractResolution(raw)
      return res ? [res] : []
    }
    case 'din': {
      const din = extractDin(raw)
      return din ? [din] : []
    }
    case 'angle': {
      const angle = extractAngle(raw)
      return angle ? [angle] : []
    }
    case 'colorTemp': {
      const temp = extractColorTemp(raw)
      return temp ? [temp] : []
    }
    case 'multiValue':
      return splitMultiValues(raw)
    case 'value':
    default:
      return [normalizeValueLabel(raw)]
  }
}

function optionLabel(config: FacetConfig, value: string): string {
  if (config.type === 'boolean') return 'Так'
  return value
}

function numericSortValue(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function sortOptions(config: FacetConfig, options: FacetOption[]): FacetOption[] {
  if (
    config.type === 'screenSize' ||
    config.type === 'speakerSize' ||
    config.type === 'angle' ||
    config.type === 'colorTemp'
  ) {
    return [...options].sort((a, b) => numericSortValue(a.value) - numericSortValue(b.value))
  }
  return [...options].sort((a, b) =>
    a.value.localeCompare(b.value, 'uk', { numeric: true, sensitivity: 'base' })
  )
}

/**
 * Build facets (with option counts) for the products currently in view.
 * Facets/options with zero matches are omitted.
 */
export function computeFacets(
  products: ProductCardWithSpecs[],
  configs: FacetConfig[]
): Facet[] {
  const facets: Facet[] = []

  for (const config of configs) {
    const counts = new Map<string, number>()
    for (const product of products) {
      const values = extractFacetValues(config, product.specs ?? {})
      for (const value of new Set(values)) {
        counts.set(value, (counts.get(value) ?? 0) + 1)
      }
    }
    if (counts.size === 0) continue

    const options: FacetOption[] = Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: optionLabel(config, value),
      count,
    }))

    facets.push({
      key: config.key,
      label: config.label,
      type: config.type,
      options: sortOptions(config, options),
    })
  }

  return facets
}

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return Array.from(new Set(list.map(s => s.trim()).filter(Boolean)))
}

/** Read the current facet selections out of the URL search params. */
export function parseFacetSelections(
  sp: Record<string, string | string[] | undefined>,
  configs: FacetConfig[]
): FacetSelections {
  const selections: FacetSelections = {}
  for (const config of configs) {
    if (RESERVED_PARAMS.has(config.key)) continue
    const values = asArray(sp[config.key])
    if (values.length > 0) selections[config.key] = values
  }
  return selections
}

/** True when a product satisfies every active facet selection (AND across facets, OR within). */
export function matchesFacets(
  specs: Record<string, string>,
  selections: FacetSelections,
  configs: FacetConfig[]
): boolean {
  for (const config of configs) {
    const selected = selections[config.key]
    if (!selected || selected.length === 0) continue
    const values = new Set(extractFacetValues(config, specs ?? {}))
    if (!selected.some(v => values.has(v))) return false
  }
  return true
}

export function countActiveFacetSelections(selections: FacetSelections): number {
  return Object.values(selections).reduce((sum, values) => sum + values.length, 0)
}
