/**
 * Optional presets for convenience. Any HTTPS `.xml` URL is accepted —
 * these are just examples, not a vendor lock-in.
 */
export const KNOWN_YML_FEEDS = [
  {
    id: 'rozetkaua',
    label: 'Приклад: Rozetka UA (без HTML)',
    url: 'https://torssen.com/price/rozetkaua.xml',
    language: 'ua',
    hasHtmlDescription: false,
  },
  {
    id: 'rozetka_html_ua',
    label: 'Приклад: Rozetka UA (HTML-опис)',
    url: 'https://torssen.com/price/rozetka_html_ua.xml',
    language: 'ua',
    hasHtmlDescription: true,
  },
] as const

export type KnownYmlFeedId = (typeof KNOWN_YML_FEEDS)[number]['id']

export const DEFAULT_XML_FEED_URL = KNOWN_YML_FEEDS[0].url

export function getKnownYmlFeed(id: string) {
  return KNOWN_YML_FEEDS.find(feed => feed.id === id) ?? null
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true
  }

  // Block obvious private / link-local IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split('.').map(Number)
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b != null && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }

  return false
}

/** SSRF guard: HTTPS public XML only. */
export function resolveYmlFeedUrl(input: {
  feedId?: string | null
  url?: string | null
}): { url: string; feedId: KnownYmlFeedId | null; hasHtmlDescription: boolean } {
  if (input.feedId) {
    const feed = getKnownYmlFeed(input.feedId)
    if (!feed) {
      throw new Error('Невідомий фід.')
    }
    return {
      url: feed.url,
      feedId: feed.id,
      hasHtmlDescription: feed.hasHtmlDescription,
    }
  }

  const raw = (input.url ?? '').trim()
  if (!raw) {
    throw new Error('Вставте посилання на XML-фід.')
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Некоректне посилання на XML.')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Дозволений лише HTTPS.')
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error('Це посилання заборонене з міркувань безпеки.')
  }
  if (!parsed.pathname.toLowerCase().endsWith('.xml')) {
    throw new Error('Посилання має вести на файл .xml')
  }

  const known = KNOWN_YML_FEEDS.find(feed => feed.url === parsed.toString() || feed.url === raw)
  return {
    url: parsed.toString(),
    feedId: known?.id ?? null,
    hasHtmlDescription: known?.hasHtmlDescription ?? parsed.pathname.toLowerCase().includes('html'),
  }
}
