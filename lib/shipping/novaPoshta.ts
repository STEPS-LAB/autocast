import { z } from 'zod'

const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/'

const npEnvelopeSchema = z.object({
  success: z.boolean().optional(),
  errors: z.array(z.string()).optional(),
  data: z.array(z.unknown()).optional(),
})

type NovaPoshtaModel = 'Address' | 'AddressGeneral' | 'InternetDocument'
type NovaPoshtaMethod =
  | 'searchSettlements'
  | 'getWarehouses'
  | 'getDocumentPrice'

type NovaPoshtaRequest = {
  modelName: NovaPoshtaModel
  calledMethod: NovaPoshtaMethod
  methodProperties: Record<string, unknown>
}

export type NovaPoshtaCitySuggestion = {
  ref: string
  name: string
  area?: string
}

export type NovaPoshtaWarehouseSuggestion = {
  ref: string
  name: string
  number?: string
  type: 'warehouse' | 'postomat' | 'other'
}

export type NovaPoshtaDocumentPrice = {
  Cost: number | string
  CostRedelivery?: number | string
  TZoneInfo?: string
}

const documentPriceSchema = z.object({
  Cost: z.union([z.string(), z.number()]),
  CostRedelivery: z.union([z.string(), z.number()]).optional(),
  TZoneInfo: z.string().optional(),
})

const cityItemSchema = z.object({
  Ref: z.string(),
  Present: z.string().optional(),
  MainDescription: z.string().optional(),
  Area: z.string().optional(),
})

const settlementSchema = z.object({
  Ref: z.string(),
  DeliveryCity: z.string().optional(),
  Present: z.string().optional(),
  MainDescription: z.string().optional(),
  Area: z.string().optional(),
})

const searchSettlementsEntrySchema = z.object({
  Addresses: z.array(settlementSchema).optional(),
})

const warehouseSchema = z.object({
  Ref: z.string(),
  Description: z.string().optional(),
  Number: z.string().optional(),
  CategoryOfWarehouse: z.string().optional(),
})

function getNovaPoshtaApiKey() {
  return process.env['NOVA_POSHTA_API_KEY'] ?? null
}

function classifyWarehouseType(category?: string): 'warehouse' | 'postomat' | 'other' {
  const normalized = (category ?? '').trim().toLowerCase()
  if (normalized.includes('postomat') || normalized.includes('поштомат')) return 'postomat'
  if (normalized.includes('branch') || normalized.includes('відділення') || normalized.includes('warehouse')) {
    return 'warehouse'
  }
  return 'other'
}

async function callNovaPoshta(request: NovaPoshtaRequest) {
  const apiKey = getNovaPoshtaApiKey()
  if (!apiKey) {
    throw new Error('NOVA_POSHTA_API_KEY is not configured')
  }

  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      modelName: request.modelName,
      calledMethod: request.calledMethod,
      methodProperties: request.methodProperties,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Nova Poshta request failed: ${response.status}`)
  }

  const payload = await response.json()
  const parsed = npEnvelopeSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error('Nova Poshta payload is invalid')
  }

  const { success, errors, data } = parsed.data
  if (success === false || (errors && errors.length > 0)) {
    throw new Error(errors?.[0] ?? 'Nova Poshta request error')
  }

  return data ?? []
}

export async function searchCities(query: string, limit = 10): Promise<NovaPoshtaCitySuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const data = await callNovaPoshta({
    modelName: 'Address',
    calledMethod: 'searchSettlements',
    methodProperties: {
      CityName: trimmed,
      Limit: Math.min(Math.max(limit, 1), 50),
    },
  })

  const entries = z.array(searchSettlementsEntrySchema).safeParse(data)
  if (!entries.success) return []

  const firstEntry = entries.data[0]
  const addresses = firstEntry?.Addresses ?? []
  return addresses.flatMap((item) => {
    const parsed = cityItemSchema.safeParse(item)
    if (!parsed.success) return []

    const name = parsed.data.Present ?? parsed.data.MainDescription ?? ''
    if (!name) return []

    // For warehouses API we need DeliveryCity (city ref), not the settlement Ref.
    const deliveryCity = (item as any)?.DeliveryCity as string | undefined
    const ref = deliveryCity && deliveryCity.trim().length > 0 ? deliveryCity : parsed.data.Ref

    return [{ ref, name, area: parsed.data.Area }]
  })
}

export async function getWarehousesByCityRef(
  cityRef: string,
  query?: string,
  limit = 25
): Promise<NovaPoshtaWarehouseSuggestion[]> {
  const trimmedCityRef = cityRef.trim()
  if (!trimmedCityRef) return []

  const data = await callNovaPoshta({
    modelName: 'AddressGeneral',
    calledMethod: 'getWarehouses',
    methodProperties: {
      CityRef: trimmedCityRef,
      FindByString: query?.trim() || '',
      Limit: Math.min(Math.max(limit, 1), 100),
    },
  })

  const parsed = z.array(warehouseSchema).safeParse(data)
  if (!parsed.success) return []

  return parsed.data.map((item) => {
    const type = classifyWarehouseType(item.CategoryOfWarehouse)
    return {
      ref: item.Ref,
      name: item.Description ?? '',
      number: item.Number,
      type,
    }
  }).filter((item) => item.name.length > 0)
}

export async function validateNovaPoshtaWarehouseAddress(input: {
  cityRef: string
  warehouseRef: string
}) {
  const { cityRef, warehouseRef } = input
  const list = await getWarehousesByCityRef(cityRef, '', 100)
  const matched = list.find((item) => item.ref === warehouseRef)
  if (!matched) return null
  return matched
}

export async function getNovaPoshtaDocumentPrice(input: {
  citySenderRef: string
  cityRecipientRef: string
  serviceType: 'WarehouseWarehouse' | 'WarehouseDoors' | 'DoorsWarehouse' | 'DoorsDoors'
  weight: number
  cost: number
  seatsAmount?: number
}) {
  const data = await callNovaPoshta({
    modelName: 'InternetDocument',
    calledMethod: 'getDocumentPrice',
    methodProperties: {
      CitySender: input.citySenderRef,
      CityRecipient: input.cityRecipientRef,
      ServiceType: input.serviceType,
      Weight: input.weight,
      Cost: input.cost,
      SeatsAmount: input.seatsAmount ?? 1,
      CargoType: 'Parcel',
    },
  })

  const parsed = z.array(documentPriceSchema).safeParse(data)
  if (!parsed.success || parsed.data.length === 0) {
    throw new Error('Nova Poshta getDocumentPrice: invalid response')
  }

  const first = parsed.data[0]!
  return {
    cost: Number(first.Cost),
    redeliveryCost: first.CostRedelivery == null ? null : Number(first.CostRedelivery),
    zoneInfo: first.TZoneInfo ?? null,
  }
}
