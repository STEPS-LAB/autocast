/**
 * Merge «Паркувальні камери» + «Паркувальні радари…» into one root:
 * «Паркувальні камери та радари» (slug: parkuvalni-kamery-ta-radary).
 *
 * Usage:
 *   node scripts/merge-parking-categories.mjs
 *   node scripts/merge-parking-categories.mjs --dry-run
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

const KEEP_SLUG = 'parkuvalni-kamery'
const MERGE_FROM_SLUG = 'parkuvalni-radary-ta-systemy-videoparkuvannya'
const NEW_NAME = 'Паркувальні камери та радари'
const NEW_SLUG = 'parkuvalni-kamery-ta-radary'

async function main() {
  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, slug, name_ua, parent_id')
  if (error) throw error

  const keep = cats.find(c => c.slug === KEEP_SLUG || c.slug === NEW_SLUG)
  const mergeFrom = cats.find(c => c.slug === MERGE_FROM_SLUG)

  if (!keep) {
    console.error(`Keep category not found (looked for ${KEEP_SLUG} / ${NEW_SLUG})`)
    process.exit(1)
  }
  if (!mergeFrom) {
    console.log(`Merge-from «${MERGE_FROM_SLUG}» already gone — checking rename only`)
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== APPLY ===')
  console.log(`Keep: ${keep.name_ua} (${keep.slug})`)
  if (mergeFrom) console.log(`From: ${mergeFrom.name_ua} (${mergeFrom.slug})`)

  const childrenToMove = mergeFrom
    ? cats.filter(c => c.parent_id === mergeFrom.id)
    : []

  for (const child of childrenToMove) {
    console.log(`MOVE  ${child.name_ua} → under ${NEW_NAME}`)
    if (!dryRun) {
      const { error: e } = await supabase
        .from('categories')
        .update({ parent_id: keep.id })
        .eq('id', child.id)
      if (e) throw e
    }
  }

  if (keep.name_ua !== NEW_NAME || keep.slug !== NEW_SLUG) {
    console.log(`RENAME ${keep.name_ua} (${keep.slug}) → ${NEW_NAME} (${NEW_SLUG})`)
    if (!dryRun) {
      const { error: e } = await supabase
        .from('categories')
        .update({ name_ua: NEW_NAME, slug: NEW_SLUG })
        .eq('id', keep.id)
      if (e) throw e
    }
  } else {
    console.log('OK    name/slug already updated')
  }

  if (mergeFrom) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', mergeFrom.id)

    if ((count ?? 0) > 0) {
      console.warn(`WARN  ${mergeFrom.slug} still has ${count} products — not deleting`)
    } else {
      console.log(`DELETE empty ${mergeFrom.name_ua} (${mergeFrom.slug})`)
      if (!dryRun) {
        // Ensure no children left
        const { data: leftover } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', mergeFrom.id)
        if (leftover?.length) {
          console.warn(`WARN  still has ${leftover.length} children — skip delete`)
        } else {
          const { error: e } = await supabase.from('categories').delete().eq('id', mergeFrom.id)
          if (e) throw e
        }
      }
    }
  }

  if (!dryRun) {
    const { data: kids } = await supabase
      .from('categories')
      .select('name_ua, slug')
      .eq('parent_id', keep.id)
      .order('name_ua')
    console.log(`\nMerged root children (${kids?.length ?? 0}):`)
    for (const k of kids ?? []) console.log(`  • ${k.name_ua}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
