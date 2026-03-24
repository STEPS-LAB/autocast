'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import Badge from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Column } from '@/components/admin/AdminTable'
import { useEffect } from 'react'

interface AdminOrder {
  id: string
  db_id: string
  customer: string
  email: string
  total: number
  status: string
  date: string
  items: number
}

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'accent' | 'success' | 'error' | 'muted' }> = {
  pending:    { label: 'Очікує відправки', variant: 'warning' },
  processing: { label: 'Обробляється', variant: 'accent' },
  shipped:    { label: 'Відправлено', variant: 'muted' },
  delivered:  { label: 'Доставлено', variant: 'success' },
  cancelled:  { label: 'Скасовано', variant: 'error' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  useEffect(() => {
    let isMounted = true
    async function loadOrders() {
      const supabase = await getSupabase()
      const { data } = await supabase
        .from('orders')
        .select('id,total,status,created_at,shipping_info,order_items(id)')
        .order('created_at', { ascending: false })

      if (!isMounted) return
      const mapped: AdminOrder[] = (data ?? []).map((row) => {
        const shipping = (row.shipping_info ?? {}) as Record<string, string>
        const firstName = shipping.first_name ?? ''
        const lastName = shipping.last_name ?? ''
        return {
          id: row.id.slice(0, 8).toUpperCase(),
          db_id: row.id,
          customer: `${firstName} ${lastName}`.trim() || 'Клієнт',
          email: shipping.email ?? '—',
          total: Number(row.total),
          status: row.status,
          date: row.created_at,
          items: Array.isArray(row.order_items) ? row.order_items.length : 0,
        }
      })
      setOrders(mapped)
      setLoading(false)
    }
    void loadOrders()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleUpdate(id: string, key: string, value: string | number) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const supabase = await getSupabase()
    await supabase.from('orders').update({ [key]: value }).eq('id', order.db_id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [key]: value } : o))
  }

  const columns: Column<AdminOrder>[] = [
    {
      key: 'id',
      label: '№ Замовлення',
      render: (row) => (
        <span className="text-sm font-mono font-semibold text-text-primary">{row.id}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Клієнт',
      render: (row) => (
        <div>
          <p className="text-sm text-text-primary">{row.customer}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Товарів',
      render: (row) => <span className="text-sm text-text-secondary">{row.items} шт.</span>,
    },
    {
      key: 'total',
      label: 'Сума',
      render: (row) => (
        <span className="text-sm font-semibold text-text-primary price">{formatPrice(row.total)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      editable: true,
      type: 'select',
      options: STATUS_OPTIONS,
      render: (row) => {
        const s = STATUS_LABELS[row.status] ?? STATUS_LABELS.pending!
        return <Badge variant={s.variant}>{s.label}</Badge>
      },
    },
    {
      key: 'date',
      label: 'Дата',
      render: (row) => (
        <span className="text-xs text-text-muted">{formatDate(row.date)}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Замовлення</h1>
        <p className="text-sm text-text-muted">{orders.length} замовлень</p>
      </div>
      <AdminTable
        data={orders}
        columns={columns}
        onUpdate={handleUpdate}
      />
      {loading && <p className="text-sm text-text-muted mt-3">Завантаження...</p>}
    </div>
  )
}
