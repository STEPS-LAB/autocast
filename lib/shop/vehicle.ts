import type { ShopFacetRow } from '@/types'

/**
 * Cascading vehicle filters (make → model → year).
 *
 * Make/model/year are not structured in the catalog — they live inside product
 * names (e.g. "Штатна магнітола Torssen 2K Honda Odyssey 2018-2022 …"). This
 * module parses them at runtime. Isolated so it can later be swapped for
 * structured data without touching the UI.
 */

export interface VehicleInfo {
  make?: string
  model?: string
  year?: string
}

export interface VehicleSelections {
  make?: string
  model?: string
  year?: string
}

export interface VehicleFacetOption {
  value: string
  label: string
  count: number
}

export interface VehicleFacets {
  makes: VehicleFacetOption[]
  models: VehicleFacetOption[]
  years: VehicleFacetOption[]
}

/** Spec keys that may hold a make (used only as fallback when name parse fails). */
const MAKE_SPEC_KEYS = ['Марка автомобіля', 'Сумісні марки автомобілів']

/**
 * Canonical makes + aliases. Multi-word entries are matched first.
 * Seeded from real catalog values; aliases normalise common short forms.
 */
const MAKE_ENTRIES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'Land Rover', aliases: ['Land Rover', 'LandRover'] },
  { canonical: 'Range Rover', aliases: ['Range Rover', 'RangeRover'] },
  { canonical: 'SsangYong', aliases: ['SsangYong', 'Ssang Yong', 'Ssangyong'] },
  { canonical: 'Great Wall', aliases: ['Great Wall', 'GreatWall', 'Great'] },
  { canonical: 'Mercedes', aliases: ['Mercedes', 'Mercedes-Benz', 'Mercedes Benz', 'Benz'] },
  { canonical: 'Volkswagen', aliases: ['Volkswagen', 'VW'] },
  { canonical: 'Chevrolet', aliases: ['Chevrolet', 'Chevy'] },
  { canonical: 'Mitsubishi', aliases: ['Mitsubishi'] },
  { canonical: 'Chrysler', aliases: ['Chrysler'] },
  { canonical: 'Cadillac', aliases: ['Cadillac'] },
  { canonical: 'Infiniti', aliases: ['Infiniti'] },
  { canonical: 'Hyundai', aliases: ['Hyundai'] },
  { canonical: 'Peugeot', aliases: ['Peugeot'] },
  { canonical: 'Citroen', aliases: ['Citroen', 'Citroën'] },
  { canonical: 'Renault', aliases: ['Renault'] },
  { canonical: 'Porsche', aliases: ['Porsche'] },
  { canonical: 'Subaru', aliases: ['Subaru'] },
  { canonical: 'Suzuki', aliases: ['Suzuki'] },
  { canonical: 'Toyota', aliases: ['Toyota'] },
  { canonical: 'Nissan', aliases: ['Nissan'] },
  { canonical: 'Honda', aliases: ['Honda'] },
  { canonical: 'Mazda', aliases: ['Mazda'] },
  { canonical: 'Lexus', aliases: ['Lexus'] },
  { canonical: 'Volvo', aliases: ['Volvo'] },
  { canonical: 'Skoda', aliases: ['Skoda', 'Škoda'] },
  { canonical: 'Audi', aliases: ['Audi'] },
  { canonical: 'BMW', aliases: ['BMW'] },
  { canonical: 'Ford', aliases: ['Ford'] },
  { canonical: 'Kia', aliases: ['Kia'] },
  { canonical: 'Fiat', aliases: ['Fiat'] },
  { canonical: 'Jeep', aliases: ['Jeep'] },
  { canonical: 'Dodge', aliases: ['Dodge'] },
  { canonical: 'Geely', aliases: ['Geely'] },
  { canonical: 'Chery', aliases: ['Chery'] },
  { canonical: 'Hummer', aliases: ['Hummer'] },
  { canonical: 'Acura', aliases: ['Acura'] },
  { canonical: 'Isuzu', aliases: ['Isuzu'] },
  { canonical: 'Iveco', aliases: ['Iveco'] },
  { canonical: 'Opel', aliases: ['Opel'] },
  { canonical: 'Seat', aliases: ['Seat', 'SEAT'] },
  { canonical: 'Smart', aliases: ['Smart'] },
  { canonical: 'UAZ', aliases: ['UAZ'] },
  { canonical: 'Jac', aliases: ['Jac', 'JAC'] },
]

/** Sorted longest-alias-first so "Land Rover" wins over a hypothetical "Land". */
const MAKE_ALIAS_LIST: Array<{ alias: string; canonical: string; re: RegExp }> = MAKE_ENTRIES.flatMap(
  entry =>
    entry.aliases.map(alias => ({
      alias,
      canonical: entry.canonical,
      re: new RegExp(`(^|[^A-Za-zÀ-ÿ])(${escapeRegExp(alias)})(?=[^A-Za-zÀ-ÿ]|$)`, 'i'),
    }))
).sort((a, b) => b.alias.length - a.alias.length)

/** Tokens that belong to the product (SKU / features), not the vehicle model. */
const NOISE_TOKEN =
  /^(?:2[Kk]|4[Gg]|Carplay|CarPlay|Android|Auto|DSP|USB|USA|Wi-?Fi|GPS|LTE|LCD|IPS|QLED|climate|Climate|Conditioner|cond|grey|Gray|black|Black|дерево|з|кнопками|кнопки|AC|MK\d*|L\/H|R\/H|\+?360|DLC\S*|F\d[\w/]*|[A-Za-z]*\/?F\d[\w/]*|R)$/i

const MAKE_SPEC_NOISE = /^(universal|універсал|універсальні?)$/i

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readSpec(specs: Record<string, string> | undefined, keys: string[]): string | undefined {
  if (!specs) return undefined
  for (const key of keys) {
    const raw = specs[key]
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim()
  }
  return undefined
}

/**
 * A token is a YEAR only when it is:
 * - a full year `19xx` / `20xx`
 * - a 2-digit year range (`13-18`, `09–15`, `14-`)
 * - a year with trailing `+` (`16+`, `2013+`)
 *
 * Bare numbers like `3008` (Peugeot model) or `55` (Camry XV55) stay MODEL.
 */
function matchYearAt(text: string, fromIndex: number): { raw: string; label: string; index: number } | null {
  const slice = text.slice(fromIndex)
  // Full year range: 2008-2012, 2010–2015, 2018-
  const fullRange = slice.match(
    /^(\s*[(\[]?\s*)((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})?\s*[)\]]?/
  )
  if (fullRange?.[2]) {
    const start = fullRange[2]
    const end = fullRange[3]
    const label = end ? `${start}–${end}` : `${start}+`
    return { raw: fullRange[0], label, index: fromIndex + (fullRange[1]?.length ?? 0) }
  }

  // Single full year with optional +: 2013+, 2018, 2008
  const fullSingle = slice.match(/^(\s*[(\[]?\s*)((?:19|20)\d{2})\s*\+?\s*[)\]]?/)
  if (fullSingle?.[2]) {
    const year = fullSingle[2]
    const hasPlus = /\+/.test(fullSingle[0])
    return {
      raw: fullSingle[0],
      label: hasPlus ? `${year}+` : year,
      index: fromIndex + (fullSingle[1]?.length ?? 0),
    }
  }

  // 2-digit range: 13-18, 09–15, 14-, 01-06
  const shortRange = slice.match(/^(\s*)(\d{2})\s*[-–—]\s*(\d{2})?/)
  if (shortRange?.[2]) {
    const a = shortRange[2]
    const b = shortRange[3]
    // Model codes almost never use "NN-NN" with a dash — treat dash ranges as years.
    const label = b ? `${expandShortYear(a)}–${expandShortYear(b)}` : `${expandShortYear(a)}+`
    return { raw: shortRange[0], label, index: fromIndex + (shortRange[1]?.length ?? 0) }
  }

  // Trailing short year+: 16+, 19+, 21+
  const shortPlus = slice.match(/^(\s*)(\d{2})\+/)
  if (shortPlus?.[2]) {
    return {
      raw: shortPlus[0],
      label: `${expandShortYear(shortPlus[2])}+`,
      index: fromIndex + (shortPlus[1]?.length ?? 0),
    }
  }

  return null
}

function expandShortYear(yy: string): string {
  // Catalog covers ~2000–2025; map 00–99 → 2000–2099 for consistency.
  return `20${yy.padStart(2, '0')}`
}

function findYearInText(text: string): { label: string; start: number; end: number } | null {
  // Scan for year patterns anywhere after the make. Prefer the leftmost match
  // that looks like a year (not a model code like 3008).
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch !== undefined && !/[\d(]/.test(ch)) continue
    // Avoid matching mid-number (e.g. digit of "3008")
    if (i > 0 && /\d/.test(text[i - 1] ?? '')) continue
    const hit = matchYearAt(text, i)
    if (!hit) continue
    // Reject bare 4-digit that isn't 19xx/20xx — already handled by regex.
    // Reject 2-digit that isn't part of range/+ (those stay in model).
    const end = i + hit.raw.length
    return { label: hit.label, start: hit.index, end }
  }
  return null
}

function findMakeInName(name: string): { make: string; endIndex: number } | null {
  let best: { make: string; endIndex: number; start: number } | null = null
  for (const entry of MAKE_ALIAS_LIST) {
    const m = entry.re.exec(name)
    if (!m || m.index === undefined) continue
    const aliasMatch = m[2]
    if (!aliasMatch) continue
    const start = m.index + (m[1]?.length ?? 0)
    const endIndex = start + aliasMatch.length
    if (!best || start < best.start || (start === best.start && aliasMatch.length > best.endIndex - best.start)) {
      best = { make: entry.canonical, endIndex, start }
    }
  }
  return best ? { make: best.make, endIndex: best.endIndex } : null
}

function cleanModel(raw: string): string | undefined {
  let s = raw
    .replace(/^\s*[/|,–—-]+\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Drop leading punctuation only (keep balanced trailing parens as part of model)
  s = s.replace(/^[(\[]\s*/, '').trim()

  if (!s) return undefined

  const tokens = s.split(/\s+/)
  const kept: string[] = []
  for (const token of tokens) {
    // Stop at first clear product-noise token
    if (NOISE_TOKEN.test(token)) break
    // Stop at inch sizes like 10.25'' / 9"
    if (/^\d+(?:[.,]\d+)?(?:''|"|”|′′)$/.test(token)) break
    kept.push(token)
  }

  let model = kept.join(' ').replace(/[,\s]+$/g, '').trim()
  // Close a dangling open paren left by year-boundary slicing: "(LC200" → "(LC200)"
  const opens = (model.match(/\(/g) ?? []).length
  const closes = (model.match(/\)/g) ?? []).length
  if (opens === closes + 1) model = `${model})`
  model = model.replace(/\s{2,}/g, ' ').trim()
  return model || undefined
}

/**
 * Parse make / model / year from a product name (+ optional specs fallback for make).
 */
export function parseVehicle(
  name: string,
  specs?: Record<string, string>
): VehicleInfo {
  const result: VehicleInfo = {}
  const makeHit = findMakeInName(name)

  if (makeHit) {
    result.make = makeHit.make
    const afterMake = name.slice(makeHit.endIndex)
    const yearHit = findYearInText(afterMake)
    if (yearHit) {
      result.year = yearHit.label
      result.model = cleanModel(afterMake.slice(0, yearHit.start))
    } else {
      result.model = cleanModel(afterMake)
    }
  } else {
    const specMake = readSpec(specs, MAKE_SPEC_KEYS)
    if (specMake && !MAKE_SPEC_NOISE.test(specMake)) {
      // Spec sometimes embeds a model ("Honda Accord") — split if known make prefix.
      const nested = findMakeInName(specMake)
      if (nested && nested.endIndex < specMake.length) {
        result.make = nested.make
        const rest = cleanModel(specMake.slice(nested.endIndex))
        if (rest) result.model = rest
      } else if (nested) {
        result.make = nested.make
      } else {
        // Unknown make string — use as-is if it looks like a single make word
        const normalised = MAKE_ENTRIES.find(
          e => e.canonical.toLowerCase() === specMake.toLowerCase()
        )
        result.make = normalised?.canonical ?? specMake
      }
    }
  }

  return result
}

function countOptions(
  values: Array<string | undefined>
): VehicleFacetOption[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, 'uk', { numeric: true, sensitivity: 'base' }))
}

/**
 * Build cascading vehicle facets. Models appear only when a make is selected;
 * years only when make + model are selected.
 */
export function buildVehicleFacets(
  products: Array<Pick<ShopFacetRow, 'name_ua' | 'specs'>>,
  selected: VehicleSelections
): VehicleFacets {
  const parsed = products.map(p => parseVehicle(p.name_ua, p.specs))

  const makes = countOptions(parsed.map(p => p.make))

  let models: VehicleFacetOption[] = []
  if (selected.make) {
    models = countOptions(
      parsed.filter(p => p.make === selected.make).map(p => p.model)
    )
  }

  let years: VehicleFacetOption[] = []
  if (selected.make && selected.model) {
    years = countOptions(
      parsed
        .filter(p => p.make === selected.make && p.model === selected.model)
        .map(p => p.year)
    )
  }

  return { makes, models, years }
}

/** True when a parsed vehicle satisfies every active selection (AND). */
export function matchesVehicle(
  info: VehicleInfo,
  selected: VehicleSelections
): boolean {
  if (selected.make && info.make !== selected.make) return false
  if (selected.model && info.model !== selected.model) return false
  if (selected.year && info.year !== selected.year) return false
  return true
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim()
  return trimmed || undefined
}

/** Read single-select vehicle cascade from URL search params. */
export function parseVehicleSelections(
  sp: Record<string, string | string[] | undefined>
): VehicleSelections {
  return {
    make: firstParam(sp.vmake),
    model: firstParam(sp.vmodel),
    year: firstParam(sp.vyear),
  }
}

export function countActiveVehicleSelections(selected: VehicleSelections): number {
  let n = 0
  if (selected.make) n++
  if (selected.model) n++
  if (selected.year) n++
  return n
}

/** Whether vehicle cascade filters should be offered for this root's facet config. */
export function rootSupportsVehicleFilters(
  facetConfigs: Array<{ key: string }>
): boolean {
  return facetConfigs.some(c => c.key === 'carmake')
}
