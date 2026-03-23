'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import { PRODUCTS, CATEGORIES, BRANDS } from '@/lib/data/seed'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { Column } from '@/components/admin/AdminTable'
import type { Product } from '@/types'
import Image from 'next/image'

type ProductRow = Product & { id: string }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>(PRODUCTS)

  function handleUpdate(id: string, key: string, value: string | number) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [key]: value } : p
    ))
  }

  function handleDelete(id: string) {
    if (!confirm('Видалити товар?')) return
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const columns: Column<ProductRow>[] = [
    {
      key: 'images',
      label: 'Фото',
      render: (row) => (
        row.images[0] ? (
          <div className="relative size-10 rounded overflow-hidden bg-bg-elevated border border-border shrink-0">
            <Image src={row.images[0]} alt={row.name_ua} fill className="object-cover" sizes="40px" />
          </div>
        ) : <div className="size-10 rounded bg-bg-elevated border border-border" />
      ),
    },
    {
      key: 'name_ua',
      label: 'Назва',
      editable: true,
      render: (row) => (
        <div className="max-w-[240px]">
          <p className="text-sm text-text-primary line-clamp-2">{row.name_ua}</p>
          <p className="text-xs text-text-muted font-mono mt-0.5">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'category_id',
      label: 'Категорія',
      render: (row) => {
        const cat = CATEGORIES.find(c => c.id === row.category_id)
        return <span className="text-sm text-text-secondary">{cat?.name_ua ?? '—'}</span>
      },
    },
    {
      key: 'price',
      label: 'Ціна',
      editable: true,
      type: 'number',
      render: (row) => (
        <div>
          <span className="text-sm font-semibold text-text-primary price">{formatPrice(row.price)}</span>
          {row.sale_price && (
            <p className="text-xs text-accent price">{formatPrice(row.sale_price)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Залишок',
      editable: true,
      type: 'number',
      render: (row) => (
        <Badge variant={row.stock > 5 ? 'success' : row.stock > 0 ? 'warning' : 'error'}>
          {row.stock} шт.
        </Badge>
      ),
    },
    {
      key: 'is_featured',
      label: 'Топ',
      render: (row) => (
        <Badge variant={row.is_featured ? 'accent' : 'muted'}>
          {row.is_featured ? 'Так' : 'Ні'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Товари</h1>
        <p className="text-sm text-text-muted">{products.length} товарів</p>
      </div>

      <AdminTable
        data={products}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAdd={() => alert('Форма додавання товару (в розробці)')}
        addLabel="Додати товар"
      />
    </div>
  )
}
