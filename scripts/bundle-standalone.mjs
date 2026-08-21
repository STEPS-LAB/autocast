#!/usr/bin/env node
/**
 * `output: 'standalone'` emits a self-contained server but deliberately leaves
 * out `public/` and `.next/static` — Next assumes a CDN serves them. When the
 * Node process is the only thing serving traffic, they have to be copied in.
 *
 * The Dockerfile does this with COPY; this script is the equivalent for a
 * plain-VPS deploy, and works on Windows too (no `cp -r`).
 *
 * Run after `npm run build`, then ship `.next/standalone/` to the server.
 */
import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const standalone = join(root, '.next', 'standalone')

if (!existsSync(standalone)) {
  console.error(
    'Missing .next/standalone — run `npm run build` first, and check that\n' +
      "next.config.ts still sets `output: 'standalone'`."
  )
  process.exit(1)
}

const copies = [
  { from: join(root, 'public'), to: join(standalone, 'public') },
  { from: join(root, '.next', 'static'), to: join(standalone, '.next', 'static') },
]

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`Skipped ${from} — not found.`)
    continue
  }
  cpSync(from, to, { recursive: true })
  console.log(`Copied ${from} -> ${to}`)
}

console.log('\nStandalone bundle ready: .next/standalone')
console.log('Start it with: node .next/standalone/server.js')
