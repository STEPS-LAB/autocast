import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('./.env.local', import.meta.url), 'utf8')
const get = k => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim()
const supabase = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: cats } = await supabase
  .from('categories')
  .select('id,slug,name_ua,parent_id,sort_order')
  .order('sort_order')

const byId = new Map(cats.map(c => [c.id, c]))
const roots = cats.filter(c => !c.parent_id)
console.log('ROOT CATEGORIES:')
for (const r of roots) console.log(`  ${r.slug}  —  ${r.name_ua}`)

function rootOf(catId) {
  let c = byId.get(catId)
  while (c && c.parent_id) c = byId.get(c.parent_id)
  return c
}

const { data: products, error } = await supabase
  .from('products')
  .select('category_id,specs')
  .limit(5000)
if (error) { console.error(error); process.exit(1) }
console.log(`\nTOTAL PRODUCTS SAMPLED: ${products.length}`)

// spec-key stats per root
const perRoot = new Map() // rootSlug -> Map(specKey -> {count, values:Map(val->n)})
const rootCount = new Map()
for (const p of products) {
  const root = rootOf(p.category_id)
  if (!root) continue
  rootCount.set(root.slug, (rootCount.get(root.slug) ?? 0) + 1)
  if (!perRoot.has(root.slug)) perRoot.set(root.slug, new Map())
  const km = perRoot.get(root.slug)
  for (const [k, v] of Object.entries(p.specs ?? {})) {
    if (!km.has(k)) km.set(k, { count: 0, values: new Map() })
    const rec = km.get(k)
    rec.count++
    rec.values.set(v, (rec.values.get(v) ?? 0) + 1)
  }
}

for (const [slug, km] of perRoot) {
  const total = rootCount.get(slug)
  console.log(`\n=== ROOT: ${slug} (${total} products) ===`)
  const rows = [...km.entries()]
    .map(([k, rec]) => ({ k, count: rec.count, distinct: rec.values.size, values: rec.values }))
    .sort((a, b) => b.count - a.count)
  for (const r of rows) {
    if (r.distinct > 40) { console.log(`  ${r.k}  [${r.count} prod, ${r.distinct} distinct] (free text)`) ; continue }
    const top = [...r.values.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([v,n])=>`${v}(${n})`).join(', ')
    console.log(`  ${r.k}  [${r.count} prod, ${r.distinct} distinct]: ${top}`)
  }
}
