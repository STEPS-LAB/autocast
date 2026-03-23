'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import { CATEGORIES } from '@/lib/data/seed'
import Image from 'next/image'
import type { Category } from '@/types'
import type { Column } from '@/components/admin/AdminTable'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)

  function handleUpdate(id: string, key: string, value: string | number) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
  }

  function handleDelete(id: string) {
    if (!confirm('Видалити категорію?')) return
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const columns: Column<Category>[] = [
    {
      key: 'image_url',
      label: 'Зображення',
      render: (row) => (
        row.image_url ? (
          <div className="relative size-10 rounded overflow-hidden bg-bg-elevated border border-border">
            <Image src={row.image_url} alt={row.name_ua} fill className="object-cover" sizes="40px" />
          </div>
        ) : <div className="size-10 rounded bg-bg-elevated border border-border" />
      ),
    },
    { key: 'name_ua', label: 'Назва', editable: true },
    { key: 'slug', label: 'Slug', editable: true },
    {
      key: 'sort_order',
      label: 'Порядок',
      editable: true,
      type: 'number',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Категорії</h1>
        <p className="text-sm text-text-muted">{categories.length} категорій</p>
      </div>
      <AdminTable
        data={categories}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAdd={() => alert('Форма додавання категорії (в розробці)')}
        addLabel="Додати категорію"
      />
    </div>
  )
}
