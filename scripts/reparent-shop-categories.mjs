/**
 * One-shot: reparent flat root categories under canonical shop parents.
 *
 * Usage:
 *   node scripts/reparent-shop-categories.mjs          # apply
 *   node scripts/reparent-shop-categories.mjs --dry-run # plan only
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

/** [childSlug, parentSlug] */
const MOVES = [
  ['avtosyhnalizatsiyi', 'okhoronni-systemy'],
  ['gsm-syhnalizatsiyi-dlya-domu', 'okhoronni-systemy'],
  ['klemy-ta-montazhni-materialy', 'vse-dlya-montazhu'],
  ['aksesuary-ta-instrumenty', 'vse-dlya-montazhu'],
  ['zamky-kapota', 'okhoronni-systemy'],
  ['mekhanichni-zamky-kpp', 'okhoronni-systemy'],
  ['muzyka', 'avtozvuk'],
  ['kamery', 'parkuvalni-kamery-ta-radary'],
  ['led-ta-hid-lampy', 'avtosvitlo'],
  ['fary', 'avtosvitlo'],
  ['led-mali', 'avtosvitlo'],
  ['parkuvalni-radary', 'parkuvalni-kamery-ta-radary'],
  ['parktroniky', 'parkuvalni-kamery-ta-radary'],
]

async function loadAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_ua, parent_id, sort_order')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

async function main() {
  const categories = await loadAllCategories()
  const bySlug = new Map(categories.map(c => [c.slug, c]))

  console.log(dryRun ? '=== DRY RUN ===' : '=== APPLY ===')
  console.log(`Loaded ${categories.length} categories, ${categories.filter(c => !c.parent_id).length} roots\n`)

  let updated = 0
  let skipped = 0

  for (const [childSlug, parentSlug] of MOVES) {
    const child = bySlug.get(childSlug)
    const parent = bySlug.get(parentSlug)

    if (!child) {
      console.warn(`SKIP  ${childSlug} — category not found`)
      skipped++
      continue
    }
    if (!parent) {
      console.warn(`SKIP  ${childSlug} → ${parentSlug} — parent not found`)
      skipped++
      continue
    }
    if (child.id === parent.id) {
      console.warn(`SKIP  ${childSlug} — child and parent are the same`)
      skipped++
      continue
    }
    if (child.parent_id === parent.id) {
      console.log(`OK    ${child.name_ua} already under ${parent.name_ua}`)
      skipped++
      continue
    }
    if (parent.parent_id) {
      console.warn(
        `WARN  parent ${parent.name_ua} is not a root (parent_id=${parent.parent_id}); proceeding anyway`
      )
    }

    const prev =
      child.parent_id == null
        ? 'ROOT'
        : (bySlug.get(categories.find(c => c.id === child.parent_id)?.slug)?.name_ua ?? child.parent_id)

    console.log(
      `${dryRun ? 'PLAN' : 'MOVE'} ${child.name_ua} (${child.slug})\n` +
        `      ${prev} → ${parent.name_ua} (${parent.slug})`
    )

    if (!dryRun) {
      const { error } = await supabase
        .from('categories')
        .update({ parent_id: parent.id })
        .eq('id', child.id)
      if (error) {
        console.error(`FAIL  ${child.slug}:`, error.message)
        process.exit(1)
      }
      child.parent_id = parent.id
    }
    updated++
  }

  console.log(`\nDone. ${dryRun ? 'Would update' : 'Updated'}: ${updated}, skipped: ${skipped}`)

  if (!dryRun && updated > 0) {
    const fresh = await loadAllCategories()
    const freshRoots = fresh
      .filter(c => !c.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name_ua.localeCompare(b.name_ua, 'uk'))
    console.log(`Roots now: ${freshRoots.length}`)
    for (const r of freshRoots) {
      const childCount = fresh.filter(c => c.parent_id === r.id).length
      console.log(`  • ${r.name_ua} (${childCount} children)`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
