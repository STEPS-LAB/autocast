import type { ShippingQuoteRequest } from '@/lib/validators/shipping.schema'

export type ShippingQuote = {
  shipping_total: number
  currency: 'UAH'
  eta: string | null
  rule_code: string
  label: string
}

const FREE_SHIPPING_THRESHOLD = 3000
const COD_FEE = 20

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateShippingQuote(input: ShippingQuoteRequest): ShippingQuote {
  const { items_total, selection } = input

  if (selection.delivery_method === 'pickup') {
    return {
      shipping_total: 0,
      currency: 'UAH',
      eta: null,
      rule_code: 'pickup_free',
      label: 'Самовивіз',
    }
  }

  if (items_total >= FREE_SHIPPING_THRESHOLD) {
    return {
      shipping_total: 0,
      currency: 'UAH',
      eta: '1-2 дні',
      rule_code: 'free_over_threshold',
      label: 'Безкоштовна доставка',
    }
  }

  let base = 0
  if (selection.delivery_method === 'nova_poshta') {
    if (selection.delivery_type === 'postomat') base = 75
    else if (selection.delivery_type === 'courier') base = 120
    else base = 90
  } else if (selection.delivery_method === 'ukr_poshta') {
    base = 60
  }

  if (selection.payment_method === 'cash_on_delivery') {
    base += COD_FEE
  }

  const shipping_total = roundMoney(base)
  const label = selection.delivery_method === 'nova_poshta'
    ? `Нова Пошта (${selection.delivery_type})`
    : 'Укрпошта'

  return {
    shipping_total,
    currency: 'UAH',
    eta: selection.delivery_method === 'nova_poshta' ? '1-2 дні' : '3-5 днів',
    rule_code: 'base_tariff',
    label,
  }
}
