'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import AdminTable from '@/components/admin/AdminTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Column } from '@/components/admin/AdminTable'

interface AdminOrder {
  id: string
  db_id: string
  customer: string
  email: string
  total: number
  ttn?: string | null
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusOrderId, setStatusOrderId] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState('pending')

  useEffect(() => {
    let isMounted = true
    async function loadOrders() {
      try {
        setLoadError(null)
        const res = await fetch('/api/admin/orders')
        const json = (await res.json()) as { orders?: Array<any>; error?: string }
        if (!res.ok) {
          throw new Error(json.error ?? 'Cannot load orders')
        }

        const mapped: AdminOrder[] = (json.orders ?? []).map((row) => {
          return {
            id: String(row.id).slice(0, 8).toUpperCase(),
            db_id: String(row.id),
            customer: row.customer ?? 'Клієнт',
            email: row.email ?? '—',
            total: Number(row.total),
            ttn: row.ttn ?? null,
            status: row.status,
            date: row.date,
            items: Number(row.items ?? 0),
          }
        })

        if (!isMounted) return
        setOrders(mapped)
        setLoading(false)
      } catch (e) {
        if (!isMounted) return
        setOrders([])
        setLoadError(e instanceof Error ? e.message : 'Cannot load orders')
        setLoading(false)
      }
    }
    void loadOrders()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleUpdate(id: string, key: string, value: string | number) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    await fetch(`/api/admin/orders/${order.db_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [key]: value } : o))
  }

  function openStatusModal(order: AdminOrder) {
    setStatusOrderId(order.id)
    setStatusValue(order.status)
  }

  async function saveOrderStatus() {
    if (!statusOrderId) return
    await handleUpdate(statusOrderId, 'status', statusValue)
    setStatusOrderId(null)
  }

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return orders

    return orders.filter((order) => {
      const statusLabel = STATUS_LABELS[order.status]?.label ?? order.status
      return (
        order.id.toLowerCase().includes(query)
        || order.customer.toLowerCase().includes(query)
        || order.email.toLowerCase().includes(query)
        || String(order.ttn ?? '').toLowerCase().includes(query)
        || statusLabel.toLowerCase().includes(query)
      )
    })
  }, [orders, searchQuery])

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
      key: 'ttn',
      label: 'ТТН',
      render: (row) => (
        <span className="text-xs text-text-secondary font-mono">
          {row.ttn ? String(row.ttn) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Замовлення</h1>
          <p className="text-sm text-text-muted">{filteredOrders.length} замовлень</p>
        </div>
        <div className="w-full max-w-md">
          <label className="sr-only" htmlFor="orders-search">Пошук замовлень</label>
          <input
            id="orders-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук замовлень..."
            className="w-full h-9 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
          />
        </div>
      </div>
      <AdminTable
        data={filteredOrders}
        columns={columns}
        onUpdate={handleUpdate}
        rowHref={(row) => `/admin/orders/${row.db_id}`}
        actionsAlwaysVisible
        renderActions={(row) => (
          <>
            <Link
              href={`/admin/orders/${row.db_id}`}
              className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Переглянути замовлення"
              title="Переглянути замовлення"
            >
              <Eye size={14} />
            </Link>
            <button
              onClick={() => openStatusModal(row)}
              className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Змінити статус"
              title="Змінити статус"
            >
              <Pencil size={14} />
            </button>
          </>
        )}
      />
      {loading && <p className="text-sm text-text-muted mt-3">Завантаження...</p>}
      {!loading && loadError && (
        <p className="text-sm text-error mt-3">
          Не вдалося завантажити замовлення. {loadError}
        </p>
      )}

      <Modal
        open={!!statusOrderId}
        onClose={() => setStatusOrderId(null)}
        title="Змінити статус замовлення"
        description="Оберіть новий статус і збережіть зміни."
        size="sm"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-text-muted">Статус</span>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]?.label ?? status}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStatusOrderId(null)}>
              Скасувати
            </Button>
            <Button onClick={saveOrderStatus}>
              Зберегти
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
