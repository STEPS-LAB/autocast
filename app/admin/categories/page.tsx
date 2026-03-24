'use client'

import { useMemo, useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import type { Category } from '@/types'
import type { Column } from '@/components/admin/AdminTable'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useEffect } from 'react'
import { slugify } from '@/lib/utils'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySortOrder, setNewCategorySortOrder] = useState('0')
  const [loading, setLoading] = useState(true)

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
      const supabase = await getSupabase()
      const { data } = await supabase
        .from('categories')
        .select('id,slug,name_ua,parent_id,image_url,sort_order')
        .order('sort_order', { ascending: true })
      if (isMounted && data) {
        setCategories(data)
      }
      if (isMounted) setLoading(false)
    }
    void loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  async function syncCatalogAfterChange() {
    try {
      await fetch('/api/admin/bootstrap', { method: 'POST' })
    } catch {
      // Ignore sync errors to keep CRUD responsive.
    }
  }

  async function handleUpdate(id: string, key: string, value: string | number) {
    const supabase = await getSupabase()
    await supabase.from('categories').update({ [key]: value }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
    await syncCatalogAfterChange()
  }

  function handleDelete(id: string) {
    setDeleteCategoryId(id)
  }

  async function confirmDelete() {
    if (!deleteCategoryId) return
    const id = deleteCategoryId
    const supabase = await getSupabase()
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteCategoryId(null)
    await syncCatalogAfterChange()
  }

  function openCreateCategoryModal() {
    const nextSort = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order)) + 1
      : 1
    setNewCategoryName('')
    setNewCategorySortOrder(String(nextSort))
    setShowAddInfo(true)
  }

  async function createCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    const slug = slugify(name)
    const sortOrder = Math.max(0, Number(newCategorySortOrder || '0'))
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('categories')
      .insert({
        name_ua: name,
        slug,
        sort_order: sortOrder,
        parent_id: null,
        image_url: null,
      })
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .single()

    if (data) {
      setCategories(prev => [...prev, data as Category].sort((a, b) => a.sort_order - b.sort_order))
      setShowAddInfo(false)
      await syncCatalogAfterChange()
    }
  }

  const columns: Column<Category>[] = [
    { key: 'name_ua', label: 'Назва', editable: true },
    {
      key: 'sort_order',
      label: 'Порядок',
      editable: true,
      type: 'number',
      min: 0,
    },
  ]

  return (
    <div className="fade-up-in">
      <div className="mb-6 fade-up-in">
        <h1 className="text-xl font-bold text-text-primary">Категорії</h1>
        <p className="text-sm text-text-muted">{categories.length} категорій</p>
      </div>
      <AdminTable
        data={categories}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        actionsAlwaysVisible
        onAdd={openCreateCategoryModal}
        addLabel="Додати категорію"
      />
      {loading && (
        <p className="text-sm text-text-muted mt-3 fade-up-in">Завантаження...</p>
      )}

      <Modal
        open={!!deleteCategoryId}
        onClose={() => setDeleteCategoryId(null)}
        title="Видалити категорію?"
        description="Цю дію неможливо скасувати."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteCategoryId(null)}>
            Скасувати
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Видалити
          </Button>
        </div>
      </Modal>

      <Modal
        open={showAddInfo}
        onClose={() => setShowAddInfo(false)}
        title="Додати категорію"
        description="Створіть нову категорію для каталогу."
        size="sm"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-text-muted">Назва</span>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
              placeholder="Напр. Автосвітло"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Порядок</span>
            <input
              type="number"
              min={0}
              value={newCategorySortOrder}
              onChange={(e) => setNewCategorySortOrder(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddInfo(false)}>
              Скасувати
            </Button>
            <Button onClick={createCategory}>
              Створити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
