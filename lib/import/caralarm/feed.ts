/**
 * Build Caralarm feed URLs from environment credentials.
 * Credentials must never be hard-coded.
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Змінна середовища ${name} не налаштована.`)
  }
  return value
}

function buildFeedUrl(path: string): string {
  const login = encodeURIComponent(requireEnv('CARALARM_LOGIN'))
  const pass = encodeURIComponent(requireEnv('CARALARM_PASSWORD'))
  return `https://www.caralarm.com.ua/${path}?login=${login}&pass=${pass}`
}

/** Full catalog feed (photos, descriptions, params) — updated ~23:00 daily. */
export function getCaralarmExportFeedUrl(): string {
  return buildFeedUrl('export_for_shop.php')
}

/** Prices + availability feed — updated 4×/day. */
export function getCaralarmMarketFeedUrl(): string {
  return buildFeedUrl('market.php')
}
