'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import Badge from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Column } from '@/components/admin/AdminTable'

interface DemoOrder {
  id: string
  customer: string
  email: string
  total: number
  status: string
  date: string
  items: number
}

const DEMO_ORDERS: DemoOrder[] = [
  { id: 'AC-991234', customer: 'Іван Петренко', email: 'ivan@example.com', total: 13000, status: 'pending', date: '2026-03-23', items: 1 },
  { id: 'AC-991235', customer: 'Марія Коваль', email: 'maria@example.com', total: 4450, status: 'processing', date: '2026-03-22', items: 2 },
  { id: 'AC-991236', customer: 'Олег Бондар', email: 'oleg@example.com', total: 15200, status: 'shipped', date: '2026-03-21', items: 1 },
  { id: 'AC-991237', customer: 'Наталія Шевченко', email: 'natalia@example.com', total: 8900, status: 'delivered', date: '2026-03-20', items: 3 },
  { id: 'AC-991238', customer: 'Дмитро Мельник', email: 'dmytro@example.com', total: 2840, status: 'pending', date: '2026-03-19', items: 1 },
  { id: 'AC-991239', customer: 'Тетяна Іваненко', email: 'tetiana@example.com', total: 6500, status: 'delivered', date: '2026-03-18', items: 2 },
]

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'accent' | 'success' | 'error' | 'muted' }> = {
  pending:    { label: 'Очікує', variant: 'warning' },
  processing: { label: 'Обробляється', variant: 'accent' },
  shipped:    { label: 'Відправлено', variant: 'muted' },
  delivered:  { label: 'Доставлено', variant: 'success' },
  cancelled:  { label: 'Скасовано', variant: 'error' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(DEMO_ORDERS)

  function handleUpdate(id: string, key: string, value: string | number) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [key]: value } : o))
  }

  const columns: Column<DemoOrder>[] = [
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
    </div>
  )
}
