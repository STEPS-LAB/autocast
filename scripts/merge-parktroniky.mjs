/**
 * Merge «4 датчики» + «8 датчиків» (+ optional «Паркувальні радари»)
 * into «Парктроніки». Sensor count stays as product spec filter
 * («Кількість датчиків»), not as categories.
 *
 * Usage:
 *   node scripts/merge-parktroniky.mjs
 *   node scripts/merge-parktroniky.mjs --dry-run
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

const dryRun = process.argv.includes('--dry-run')
const supabase = createClient(url, key)

const PARENT_SLUG = 'parkuvalni-kamery-ta-radary'
const TARGET_NAME = 'Парктроніки'
const TARGET_SLUG = 'parktroniky'
const SOURCE_SLUGS = ['4-datchyky', '8-datchykiv', 'parkuvalni-radary']
const SENSOR_SPEC = 'Кількість датчиків'
const SENSOR_BY_SOURCE = {
  '4-datchyky': '4',
  '8-datchykiv': '8',
}

async function moveProducts(fromId, toId, ensureSensor) {
  const pageSize = 100
  let from = 0
  let moved = 0
  for (;;) {
    const { data: batch, error } = await supabase
      .from('products')
      .select('id, specs')
      .eq('category_id', fromId)
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!batch?.length) break

    for (const p of batch) {
      const specs = { ...(p.specs ?? {}) }
      if (ensureSensor && !specs[SENSOR_SPEC]) {
        specs[SENSOR_SPEC] = ensureSensor
      }
      if (dryRun) {
        moved++
        continue
      }
      const { error: e } = await supabase
        .from('products')
        .update({ category_id: toId, specs })
        .eq('id', p.id)
      if (e) throw e
      moved++
    }

    if (batch.length < pageSize) break
    from += pageSize
  }
  return moved
}

async function main() {
  const { data: parent, error: pe } = await supabase
    .from('categories')
    .select('id, name_ua, slug')
    .eq('slug', PARENT_SLUG)
    .maybeSingle()
  if (pe) throw pe
  if (!parent) {
    console.error(`Parent ${PARENT_SLUG} not found`)
    process.exit(1)
  }

  const { data: cats, error: ce } = await supabase
    .from('categories')
    .select('id, slug, name_ua, parent_id')
  if (ce) throw ce

  const bySlug = new Map(cats.map(c => [c.slug, c]))
  let target =
    bySlug.get(TARGET_SLUG) ||
    cats.find(c => c.name_ua === TARGET_NAME && c.parent_id === parent.id) ||
    bySlug.get('parkuvalni-radary')

  console.log(dryRun ? '=== DRY RUN ===' : '=== APPLY ===')
  console.log(`Parent: ${parent.name_ua}`)

  if (!target) {
    console.log(`CREATE ${TARGET_NAME} (${TARGET_SLUG})`)
    if (!dryRun) {
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          name_ua: TARGET_NAME,
          slug: TARGET_SLUG,
          parent_id: parent.id,
          sort_order: 50,
        })
        .select('id, slug, name_ua, parent_id')
        .single()
      if (error) throw error
      target = created
    } else {
      target = { id: 'dry-run', slug: TARGET_SLUG, name_ua: TARGET_NAME, parent_id: parent.id }
    }
  } else if (target.name_ua !== TARGET_NAME || target.slug !== TARGET_SLUG || target.parent_id !== parent.id) {
    console.log(
      `RENAME/MOVE ${target.name_ua} (${target.slug}) → ${TARGET_NAME} (${TARGET_SLUG}) under parent`
    )
    if (!dryRun) {
      const { data: updated, error } = await supabase
        .from('categories')
        .update({ name_ua: TARGET_NAME, slug: TARGET_SLUG, parent_id: parent.id })
        .eq('id', target.id)
        .select('id, slug, name_ua, parent_id')
        .single()
      if (error) throw error
      target = updated
    }
  } else {
    console.log(`OK target ${TARGET_NAME} (${TARGET_SLUG})`)
  }

  for (const slug of SOURCE_SLUGS) {
    const src = bySlug.get(slug)
    if (!src) {
      console.log(`SKIP  ${slug} — not found`)
      continue
    }
    if (src.id === target.id) {
      console.log(`SKIP  ${slug} — is target`)
      continue
    }

    const ensureSensor = SENSOR_BY_SOURCE[slug] ?? null
    const moved = await moveProducts(src.id, target.id, ensureSensor)
    console.log(`MOVE  ${moved} products: ${src.name_ua} → ${TARGET_NAME}`)

    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', src.id)

    if ((count ?? 0) > 0 && !dryRun) {
      console.warn(`WARN  ${src.slug} still has ${count} products — not deleting`)
      continue
    }

    console.log(`DELETE empty ${src.name_ua} (${src.slug})`)
    if (!dryRun) {
      const { error } = await supabase.from('categories').delete().eq('id', src.id)
      if (error) throw error
    }
  }

  if (!dryRun) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', target.id)
    console.log(`\n${TARGET_NAME} now has ${count} products`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
