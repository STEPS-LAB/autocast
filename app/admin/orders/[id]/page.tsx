'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'

type ShippingInfo = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  city?: string
  address?: string
  delivery_method?: string
  payment_method?: string
  notes?: string
}

type OrderItem = {
  id: string
  qty: number
  unit_price: number
  product: { id: string; slug: string; name_ua: string } | { id: string; slug: string; name_ua: string }[] | null
}

type AdminOrderDetails = {
  id: string
  total: number
  status: string
  created_at: string
  shipping_info: ShippingInfo | null
  order_items: OrderItem[]
}

function formatPhoneUa(value: string | null | undefined) {
  const raw = (value ?? '').trim()
  if (!raw) return '—'
  const digits = raw.replace(/\D/g, '')
  // Stored as 9 digits (XXYYYYYYY) where full phone becomes +38 (0XX) YYY-YY-YY
  if (digits.length === 9) {
    const xx = digits.slice(0, 2)
    const rest = digits.slice(2)
    return `+38 (0${xx}) ${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5, 7)}`
  }
  // If value already contains country code, try to normalize.
  if (digits.startsWith('380') && digits.length >= 12) {
    const local = digits.slice(3)
    const trimmed = local.startsWith('0') ? local.slice(1) : local
    if (trimmed.length >= 9) {
      const d9 = trimmed.slice(0, 9)
      const xx = d9.slice(0, 2)
      const rest = d9.slice(2)
      return `+38 (0${xx}) ${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5, 7)}`
    }
  }
  return raw
}

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'accent' | 'success' | 'error' | 'muted' }> = {
  pending: { label: 'Очікує відправки', variant: 'warning' },
  processing: { label: 'Обробляється', variant: 'accent' },
  shipped: { label: 'Відправлено', variant: 'muted' },
  delivered: { label: 'Доставлено', variant: 'success' },
  cancelled: { label: 'Скасовано', variant: 'error' },
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>()
  const orderId = params.id
  const [order, setOrder] = useState<AdminOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const orderNumber = useMemo(
    () => (order ? order.id.slice(0, 8).toUpperCase() : orderId.slice(0, 8).toUpperCase()),
    [order, orderId]
  )

  useEffect(() => {
    let isMounted = true

    async function loadOrder() {
      const mod = await import('@/lib/supabase/client')
      const supabase = mod.createClient()
      const { data } = await supabase
        .from('orders')
        .select(`
          id,total,status,created_at,shipping_info,
          order_items(
            id,qty,unit_price,
            product:products(id,slug,name_ua)
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (!isMounted) return
      setOrder((data as AdminOrderDetails | null) ?? null)
      setLoading(false)
    }

    void loadOrder()
    return () => {
      isMounted = false
    }
  }, [orderId])

  const shipping = (order?.shipping_info ?? {}) as ShippingInfo
  const isPickup = shipping.delivery_method === 'pickup'
  const status =
    STATUS_LABELS[order?.status ?? 'pending'] ??
    STATUS_LABELS['pending'] ??
    { label: 'Очікує відправки', variant: 'warning' as const }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Назад до замовлень
          </Link>
          <h1 className="text-xl font-bold text-text-primary mt-2">
            Замовлення #{orderNumber}
          </h1>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {loading && <p className="text-sm text-text-muted">Завантаження...</p>}

      {!loading && !order && (
        <div className="rounded-md border border-border bg-bg-surface p-5">
          <p className="text-sm text-text-muted">Замовлення не знайдено.</p>
        </div>
      )}

      {order && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-bg-surface p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Інформація про замовлення</h2>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <span className="text-text-muted">Дата та час:</span>{' '}
                  <span className="text-text-primary">{formatDateTime(order.created_at)}</span>
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Сума:</span>{' '}
                  <span className="text-text-primary font-semibold price">{formatPrice(order.total)}</span>
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-bg-surface p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Дані покупця</h2>
              <div className="space-y-2 text-sm">
                <p className="text-text-secondary">
                  <span className="text-text-muted">ПІБ:</span>{' '}
                  <span className="text-text-primary">
                    {(shipping.first_name ?? '')} {(shipping.last_name ?? '')}
                  </span>
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Email:</span>{' '}
                  <span className="text-text-primary">{shipping.email ?? '—'}</span>
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-muted">Телефон:</span>{' '}
                  <span className="text-text-primary">{formatPhoneUa(shipping.phone)}</span>
                </p>
                {isPickup ? (
                  <p className="text-text-secondary">
                    <span className="text-text-muted">Доставка:</span>{' '}
                    <span className="text-text-primary">
                      Самовивіз (м. Житомир, вулиця Вітрука, 12в)
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Місто:</span>{' '}
                      <span className="text-text-primary">{shipping.city ?? '—'}</span>
                    </p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Адреса:</span>{' '}
                      <span className="text-text-primary">{shipping.address ?? '—'}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Товари в замовленні</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-primary">Товар</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-primary">Кількість</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-primary">Ціна</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-primary">Сума</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.order_items.map((item) => {
                    const product = Array.isArray(item.product) ? item.product[0] : item.product
                    const lineTotal = Number(item.unit_price) * Number(item.qty)
                    return (
                      <tr key={item.id} className="hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3 text-text-primary">
                          {product?.name_ua ? (
                            <Link href={`/product/${product.slug}`} className="hover:text-accent transition-colors">
                              {product.name_ua}
                            </Link>
                          ) : (
                            'Товар видалено'
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{item.qty} шт.</td>
                        <td className="px-4 py-3 text-text-secondary price">{formatPrice(Number(item.unit_price))}</td>
                        <td className="px-4 py-3 text-text-primary font-semibold price">{formatPrice(lineTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
