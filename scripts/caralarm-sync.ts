/**
 * CLI entry for Caralarm sync (GitHub Actions / local).
 *
 * Usage:
 *   npx tsx scripts/caralarm-sync.ts --mode=catalog
 *   npx tsx scripts/caralarm-sync.ts --mode=prices
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   CARALARM_LOGIN, CARALARM_PASSWORD
 *   REVALIDATE_URL (optional), CRON_SECRET (optional)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { runCaralarmSync } from '../lib/import/caralarm/sync'
import type { CaralarmSyncMode } from '../lib/import/caralarm/types'

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

function parseMode(argv: string[]): CaralarmSyncMode {
  const arg = argv.find(a => a.startsWith('--mode='))
  const value = arg?.slice('--mode='.length) ?? 'catalog'
  if (value === 'prices' || value === 'catalog') return value
  throw new Error(`Невідомий mode: ${value}. Використайте catalog або prices.`)
}

async function revalidateCatalog() {
  const url = process.env['REVALIDATE_URL']?.trim()
  const secret = process.env['CRON_SECRET']?.trim()
  if (!url || !secret) {
    console.log('Skip revalidate: REVALIDATE_URL / CRON_SECRET not set')
    return
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Revalidate failed HTTP ${response.status}: ${body}`)
  }
  console.log('Catalog cache revalidated')
}

async function main() {
  const mode = parseMode(process.argv.slice(2))
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim()
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim()
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  if (!process.env['CARALARM_LOGIN']?.trim() || !process.env['CARALARM_PASSWORD']?.trim()) {
    throw new Error('CARALARM_LOGIN and CARALARM_PASSWORD are required')
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  console.log(`Starting Caralarm sync mode=${mode}`)
  const started = Date.now()

  const result = await runCaralarmSync({
    mode,
    supabase,
    onProgress: progress => {
      if (progress.processed % 50 === 0 || progress.processed === progress.total) {
        console.log(
          `[${progress.processed}/${progress.total}] created=${progress.created} updated=${progress.updated} deleted=${progress.deleted} skipped=${progress.skipped}${
            progress.message ? ` — ${progress.message}` : ''
          }`
        )
      }
    },
  })

  const elapsedSec = Math.round((Date.now() - started) / 1000)
  console.log(
    JSON.stringify(
      {
        mode,
        elapsedSec,
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        skipped: result.skipped,
        priceUpdates: result.priceUpdates,
        processed: result.processed,
        total: result.total,
        done: result.done,
        errors: result.errors.slice(0, 20),
      },
      null,
      2
    )
  )

  if (result.errors.length > 0 && !result.done) {
    process.exitCode = 1
  }

  if (result.done) {
    await revalidateCatalog()
  } else {
    console.warn('Sync incomplete (done=false) — skipping revalidate')
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
