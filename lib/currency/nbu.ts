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

export async function fetchNbuUsdRate(): Promise<NbuUsdRate> {
  const response = await fetch(NBU_USD_URL, {
    next: { revalidate: 86_400 },
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
    fetchedAt: row?.exchangedate ?? new Date().toISOString(),
  }
}
