/**
 * Best-effort PDF text extraction without heavy native deps.
 * Works for simple text PDFs ( Tj / TJ / literal strings ). Not OCR.
 */

const MAX_PDF_BYTES = 4_000_000
const MAX_TEXT_CHARS = 8_000

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)))
}

function collectLiterals(bin: string): string[] {
  const out: string[] = []
  const re = /\((?:\\.|[^\\)])*\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(bin)) !== null) {
    const inner = match[0].slice(1, -1)
    const text = decodePdfLiteral(inner).trim()
    if (text.length >= 2 && /[\p{L}\p{N}]/u.test(text)) {
      out.push(text)
    }
  }
  return out
}

/** Extract readable text from a PDF buffer. Returns '' if nothing useful. */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  if (buffer.length === 0 || buffer.length > MAX_PDF_BYTES) return ''
  const head = buffer.subarray(0, 8).toString('latin1')
  if (!head.startsWith('%PDF')) return ''

  const bin = buffer.toString('latin1')
  const parts = collectLiterals(bin)
  if (parts.length === 0) return ''

  const joined = parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_CHARS)

  // Ignore garbage that is mostly control / non-letters
  const letters = (joined.match(/\p{L}/gu) ?? []).length
  if (letters < 20) return ''
  return joined
}

export function collectPdfUrlsFromText(value: string): string[] {
  const re = /https?:\/\/[^\s<>"']+\.pdf(?:\?[^\s<>"']*)?/gi
  const urls: string[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = re.exec(value)) !== null) {
    const url = match[0].replace(/[),.;]+$/, '')
    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    urls.push(url)
  }
  return urls
}

/** Download a PDF and extract text. Soft-fails on network/parse errors. */
export async function fetchPdfText(
  url: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  const timeoutMs = options?.timeoutMs ?? 8_000
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutocastImporter/1.0',
        Accept: 'application/pdf,*/*',
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return ''
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !/pdf|octet-stream/i.test(contentType)) {
      // Some CDNs omit type — still try if URL ends with .pdf
      if (!/\.pdf(\?|$)/i.test(url)) return ''
    }
    const buf = Buffer.from(await response.arrayBuffer())
    return extractTextFromPdfBuffer(buf)
  } catch {
    return ''
  }
}
