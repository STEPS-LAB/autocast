/**
 * One-shot: create Автохімія subcategories and move products into them
 * based on Decibel image path `/category-{slug}/` (no full re-import).
 *
 * Usage: node scripts/redistribute-avtokhimiya.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(root, '.env.local'), 'utf8')
const get = k => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim()

const url = get('NEXT_PUBLIC_SUPABASE_URL')
const key = get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

/** Decibel image slug → subcategory name_ua */
const SLUG_TO_NAME = {
  sampuni: 'Шампуні',
  ocishhuvaci: 'Очисники',
  'ocishhuvaci-skla': 'Очисники скла',
  visk: 'Віск',
  aromatizatori: 'Ароматизатори',
  'dlya-diskiv': 'Для дисків',
  'dlya-obbivki': 'Для оббивки',
  'dlya-plastiku': 'Для пластику',
  'dlya-zovnisnyogo-plastiku': 'Для пластику',
  'dlya-sin': 'Для шин',
  'dlya-skiri': 'Для шкіри',
  kuzov: 'Кузов',
  salon: 'Салон',
  sklo: 'Скло',
  kolesa: 'Колеса',
  inventar: 'Інвентар',
  nabori: 'Набори',
  'kvik-deteileri-ta-zaxisni-pokrittya': 'Захисні покриття',
  'rozmorozuvaci-zamkiv': 'Розморожувачі замків',
  'rozmorozuvaci-skla': 'Розморожувачі скла',
  omivaci: 'Омивачі',
  antidoshh: 'Антидощ',
  antituman: 'Антитуман',
  'pidkapotnii-prostir': 'Підкапотний простір',
}

function slugifyUa(name) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
    з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
    о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: '',
  }
  return name
    .toLowerCase()
    .split('')
    .map(ch => map[ch] ?? ch)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function categorySlugFromImages(images) {
  for (const src of images ?? []) {
    const m = /\/category-([a-z0-9-]+)\//i.exec(src)
    if (m?.[1]) return m[1].toLowerCase()
  }
  return null
}

function inferNameFromProduct(product) {
  const fromImg = categorySlugFromImages(product.images)
  if (fromImg && SLUG_TO_NAME[fromImg]) return SLUG_TO_NAME[fromImg]

  const title = (product.name_ua ?? '').toLowerCase()
  const rules = [
    [/шампун|пін[аи]/, 'Шампуні'],
    [/скл[ао].*очищ|очищ.*скл|glass cleaner/, 'Очисники скла'],
    [/очищ|клінер|cleaner/, 'Очисники'],
    [/віск|полір|wax|polish/, 'Віск'],
    [/ароматиз/, 'Ароматизатори'],
    [/шкір|leather/, 'Для шкіри'],
    [/диск/, 'Для дисків'],
    [/шин|tire|tyre/, 'Для шин'],
    [/оббив|тканин|tapiк|upholstery/, 'Для оббивки'],
    [/пластик|гум/, 'Для пластику'],
    [/кераміч|покритт|ceramic/, 'Захисні покриття'],
    [/кузов|body/, 'Кузов'],
    [/мікрофібр|тригер|аплікатор|інвентар|губка/, 'Інвентар'],
    [/набір/, 'Набори'],
  ]
  for (const [re, name] of rules) {
    if (re.test(title)) return name
  }
  return fromImg ? (SLUG_TO_NAME[fromImg] ?? null) : null
}

async function uniqueSlug(base, reserved) {
  let candidate = base || 'category'
  let n = 2
  while (reserved.has(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  reserved.add(candidate)
  return candidate
}

async function main() {
  const { data: cats, error: catsErr } = await supabase
    .from('categories')
    .select('id,slug,name_ua,parent_id,sort_order')
  if (catsErr) throw catsErr

  const parent =
    cats.find(c => c.slug === 'avtokhimiya') ||
    cats.find(c => c.name_ua === 'Автохімія' && !c.parent_id)
  if (!parent) {
    console.error('Категорію Автохімія не знайдено')
    process.exit(1)
  }

  console.log(`Parent: ${parent.name_ua} (${parent.id})`)

  const reservedSlugs = new Set(cats.map(c => c.slug))
  const byNameUnderParent = new Map()
  for (const c of cats) {
    if (c.parent_id === parent.id) {
      byNameUnderParent.set(c.name_ua.trim().toLowerCase(), c)
    }
  }

  // Also reuse same-named subcats that may already exist elsewhere
  const byNameAny = new Map()
  for (const c of cats) {
    byNameAny.set(c.name_ua.trim().toLowerCase(), c)
  }

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id,name_ua,images,category_id')
    .eq('category_id', parent.id)
  if (prodErr) throw prodErr

  console.log(`Products on parent: ${products.length}`)

  /** @type {Map<string, string[]>} name -> product ids */
  const buckets = new Map()
  const unmatched = []

  for (const p of products) {
    const name = inferNameFromProduct(p)
    if (!name) {
      unmatched.push(p)
      continue
    }
    const list = buckets.get(name) ?? []
    list.push(p.id)
    buckets.set(name, list)
  }

  console.log('\nPlan:')
  for (const [name, ids] of [...buckets.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${name}: ${ids.length}`)
  }
  if (unmatched.length) {
    console.log(`  (без підкатегорії): ${unmatched.length}`)
    for (const p of unmatched.slice(0, 10)) {
      console.log(`    - ${p.name_ua}`)
    }
  }

  let nextSort = 1
  for (const c of cats) {
    if (c.parent_id === parent.id && typeof c.sort_order === 'number' && c.sort_order >= nextSort) {
      nextSort = c.sort_order + 1
    }
  }

  let created = 0
  let reused = 0
  let moved = 0

  for (const [name, ids] of buckets) {
    const key = name.toLowerCase()
    let cat = byNameUnderParent.get(key)

    if (!cat) {
      // Prefer attaching existing same-name category under parent if it was flat
      const existing = byNameAny.get(key)
      if (existing && existing.id !== parent.id && !existing.parent_id) {
        const { data: updated, error } = await supabase
          .from('categories')
          .update({ parent_id: parent.id })
          .eq('id', existing.id)
          .select('id,slug,name_ua,parent_id')
          .single()
        if (error) throw error
        cat = updated
        byNameUnderParent.set(key, cat)
        reused += 1
        console.log(`  linked existing «${name}» under Автохімія`)
      }
    }

    if (!cat) {
      const slug = await uniqueSlug(slugifyUa(name), reservedSlugs)
      const { data: inserted, error } = await supabase
        .from('categories')
        .insert({
          slug,
          name_ua: name,
          parent_id: parent.id,
          image_url: null,
          sort_order: nextSort++,
        })
        .select('id,slug,name_ua,parent_id')
        .single()
      if (error) throw error
      cat = inserted
      byNameUnderParent.set(key, cat)
      byNameAny.set(key, cat)
      created += 1
      console.log(`  created «${name}» (${slug})`)
    }

    // Move in chunks
    const chunk = 50
    for (let i = 0; i < ids.length; i += chunk) {
      const slice = ids.slice(i, i + chunk)
      const { error } = await supabase
        .from('products')
        .update({ category_id: cat.id })
        .in('id', slice)
      if (error) throw error
      moved += slice.length
    }
  }

  console.log(`\nDone. created=${created} reused/linked=${reused} moved=${moved} unmatched=${unmatched.length}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
