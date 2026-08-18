/** Shared XML / HTML text helpers for catalog feed parsers. */

function decodeXmlEntitiesOnce(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    // `&amp;` last so a single correct escape still works; OpenCart YML often
    // double-escapes (`&amp;quot;` → `&quot;`), which needs a second pass.
    .replace(/&amp;/g, '&')
}

/** Decode XML entities; repeat for double-escaped feed text (`&amp;quot;` → `"`). */
export function decodeXmlEntities(value: string): string {
  let current = value
  for (let i = 0; i < 3; i++) {
    const next = decodeXmlEntitiesOnce(current)
    if (next === current) return current
    current = next
  }
  return current
}

export function stripHtmlToText(value: string): string {
  const withoutCdata = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')

  return decodeXmlEntities(withoutCdata)
    .replace(/<\s*;\s*p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function tagContent(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')
  const match = re.exec(xml)
  if (!match?.[1]) return null
  return match[1].trim()
}

/** Read a tag body without copying an unbounded description into memory. */
export function tagContentMax(xml: string, tag: string, maxChars: number): string | null {
  const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'i').exec(xml)
  if (!open || open.index == null) return null
  const start = open.index + open[0].length
  const close = new RegExp(`</${tag}>`, 'i').exec(xml.slice(start))
  const rawEnd = close ? start + close.index : xml.length
  const end = Math.min(rawEnd, start + Math.max(0, maxChars))
  const value = xml.slice(start, end).trim()
  return value || null
}

export function allTagContents(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi')
  const values: string[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    const value = match[1]?.trim()
    if (value) values.push(value)
  }
  return values
}

export function parseNumber(value: string | null): number | null {
  if (!value) return null
  const normalized = value.replace(/\s+/g, '').replace(',', '.')
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

export async function* readTextChunks(
  source: ReadableStream<Uint8Array> | NodeJS.ReadableStream
): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8')

  if (typeof (source as ReadableStream<Uint8Array>).getReader === 'function') {
    const reader = (source as ReadableStream<Uint8Array>).getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) yield decoder.decode(value, { stream: true })
    }
    const tail = decoder.decode()
    if (tail) yield tail
    return
  }

  const nodeStream = source as NodeJS.ReadableStream
  for await (const chunk of nodeStream) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as Buffer)
    yield decoder.decode(buf, { stream: true })
  }
  const tail = decoder.decode()
  if (tail) yield tail
}
