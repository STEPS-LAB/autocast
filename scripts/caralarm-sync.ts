/**
 * CLI entry for Caralarm sync (GitHub Actions / local).
 * Currently disabled — restore the previous implementation to re-enable.
 */
async function main() {
  throw new Error('Синхронізацію Caralarm вимкнено.')
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
