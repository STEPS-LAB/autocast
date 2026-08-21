const NBU_USD_URL =
  'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json'

export interface NbuUsdRate {
  rate: number
  fetchedAt: string
}

type NbuExchangeRow = {
  rate?: number | string
  exchangedate?: string
}

/** NBU returns dates as DD.MM.YYYY — normalize to ISO for JS Date parsing. */
export function parseNbuExchangeDate(value?: string): string {
  if (!value?.trim()) return new Date().toISOString()

  const trimmed = value.trim()
  const dmy = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const date = new Date(year, month - 1, day)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()

  return new Date().toISOString()
}

/**
 * The admin dashboard awaits this before rendering anything, so an
 * unresponsive bank.gov.ua would otherwise hang the whole page until Node's
 * socket timeout. `getUsdRate()` falls back to a static rate on throw, so
 * failing fast here is strictly better than waiting.
 */
const NBU_TIMEOUT_MS = 5_000

export async function fetchNbuUsdRate(): Promise<NbuUsdRate> {
  const response = await fetch(NBU_USD_URL, {
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(NBU_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`NBU API responded with ${response.status}`)
  }

  const data = (await response.json()) as NbuExchangeRow[]
  const row = data[0]
  const rate = Number(row?.rate)

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('NBU API returned an invalid USD rate')
  }

  return {
    rate,
    fetchedAt: parseNbuExchangeDate(row?.exchangedate),
  }
}
