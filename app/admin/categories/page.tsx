'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { generateId, slugify } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import CategoryCombobox from '@/components/admin/CategoryCombobox'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ id: string; key: 'name_ua' | 'sort_order' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [parentEditCategoryId, setParentEditCategoryId] = useState<string | null>(null)
  const [parentEditValue, setParentEditValue] = useState('')
  const [parentEditError, setParentEditError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [addingParentId, setAddingParentId] = useState<string | null>(null)
  const [addingName, setAddingName] = useState('')
  const [addingError, setAddingError] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

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

  async function handleUpdate(id: string, key: string, value: string | number | null) {
    const supabase = await getSupabase()
    const row = categories.find(c => c.id === id)
    const isTempSlug = !!row?.slug && row.slug.startsWith('temp-')
    const payload: Record<string, string | number | null> = { [key]: value as any }
    if (key === 'name_ua' && typeof value === 'string' && isTempSlug) {
      const nextSlug = slugify(value.trim())
      if (nextSlug) payload['slug'] = nextSlug
    }
    await supabase.from('categories').update(payload).eq('id', id)
    setCategories(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = { ...c, [key]: value } as any
      if (payload['slug'] && typeof payload['slug'] === 'string') next.slug = payload['slug']
      return next
    }))
    await syncCatalogAfterChange()
  }

  function handleDelete(id: string) {
    setDeleteCategoryId(id)
    setDeleteError('')
  }

  async function confirmDelete() {
    if (!deleteCategoryId) return
    const id = deleteCategoryId
    const supabase = await getSupabase()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      setDeleteError(
        error.message?.toLowerCase().includes('violates foreign key constraint')
          ? 'Неможливо видалити: ця категорія використовується у товарах.'
          : 'Не вдалося видалити категорію.'
      )
      return
    }
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteCategoryId(null)
    await syncCatalogAfterChange()
  }

  function openCreateCategoryModal(parentId?: string | null) {
    setNewCategoryName('')
    setNewCategoryParentId(parentId ?? null)
    setShowAddInfo(true)
  }

  async function createCategory() {
    const name = newCategoryName.trim()
    if (!name) return

    const parentId = newCategoryParentId
    const siblings = categories.filter(c => (c.parent_id ?? null) === parentId)
    const nextSort = siblings.length > 0 ? Math.max(...siblings.map(c => c.sort_order)) + 1 : 1
    const slug = slugify(name) || `temp-${generateId()}`
    const sortOrder = nextSort
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('categories')
      .insert({
        name_ua: name,
        slug,
        sort_order: sortOrder,
        parent_id: parentId,
        image_url: null,
      })
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .single()

    if (data) {
      setCategories(prev => [...prev, data as Category].sort((a, b) => a.sort_order - b.sort_order))
      setShowAddInfo(false)
      if (parentId) setExpanded(prev => ({ ...prev, [parentId]: true }))
      await syncCatalogAfterChange()
    }
  }

  async function createSubcategoryInline(parentId: string) {
    const parent = categories.find(c => c.id === parentId) ?? null
    if (!parent || parent.parent_id) {
      setAddingError('Підкатегорії можна додавати лише до категорій верхнього рівня.')
      return
    }
    const name = addingName.trim()
    if (!name) return
    if (addingSaving) return
    setAddingError('')
    setAddingSaving(true)
    const siblings = categories.filter(c => c.parent_id === parentId)
    const nextSort = siblings.length > 0 ? Math.max(...siblings.map(c => c.sort_order)) + 1 : 1
    const slug = slugify(name) || `temp-${generateId()}`
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name_ua: name,
        slug,
        sort_order: nextSort,
        parent_id: parentId,
        image_url: null,
      })
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .single()

    if (error || !data) {
      setAddingError(error?.message || 'Не вдалося додати підкатегорію.')
      setAddingSaving(false)
      return
    }
    setCategories(prev => [...prev, data as Category].sort((a, b) => a.sort_order - b.sort_order))
    setAddingName('')
    setAddingParentId(null)
    setAddingSaving(false)
    await syncCatalogAfterChange()
  }

  type Row = (Category & { depth: number }) | { id: string; kind: 'add'; parentId: string; depth: number }

  const { rows, childrenCountById, nameById, descendantIdsById, byParent } = useMemo(() => {
    const byParent = new Map<string | null, Category[]>()
    for (const c of categories) {
      const key = c.parent_id ?? null
      const list = byParent.get(key) ?? []
      list.push(c)
      byParent.set(key, list)
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => (a.sort_order - b.sort_order) || a.name_ua.localeCompare(b.name_ua))
    }

    const nameById = new Map(categories.map(c => [c.id, c.name_ua]))
    const childrenCountById = new Map<string, number>()
    for (const c of categories) {
      childrenCountById.set(c.id, (byParent.get(c.id)?.length ?? 0))
    }

    const out: Row[] = []
    function walk(parentId: string | null, depth: number) {
      const kids = byParent.get(parentId) ?? []
      for (const k of kids) {
        out.push({ ...k, depth })
        if (expanded[k.id]) {
          if (addingParentId === k.id) {
            out.push({ id: `__add__${k.id}`, kind: 'add', parentId: k.id, depth: depth + 1 })
          }
          walk(k.id, depth + 1)
        }
      }
    }
    walk(null, 0)

    function collectDescendants(rootId: string): Set<string> {
      const out = new Set<string>()
      const stack = [...(byParent.get(rootId) ?? [])]
      while (stack.length > 0) {
        const cur = stack.pop()
        if (!cur) break
        if (out.has(cur.id)) continue
        out.add(cur.id)
        const kids = byParent.get(cur.id) ?? []
        for (const k of kids) stack.push(k)
      }
      return out
    }
    const descendantIdsById = new Map<string, Set<string>>()
    for (const c of categories) {
      descendantIdsById.set(c.id, collectDescendants(c.id))
    }

    return { rows: out, childrenCountById, nameById, descendantIdsById, byParent }
  }, [categories, expanded, addingParentId])

  function startEdit(row: Category, key: 'name_ua' | 'sort_order') {
    setEditingCell({ id: row.id, key })
    setEditValue(key === 'sort_order' ? String(row.sort_order) : row.name_ua)
  }

  async function saveEdit() {
    if (!editingCell) return
    const { id, key } = editingCell
    const next = key === 'sort_order'
      ? Math.max(0, Number(editValue || '0'))
      : editValue
    await handleUpdate(id, key, next)
    setEditingCell(null)
  }

  function cancelEdit() {
    setEditingCell(null)
  }

  function openParentModal(row: Category) {
    setParentEditCategoryId(row.id)
    setParentEditValue(row.parent_id ?? '')
    setParentEditError('')
  }

  async function saveParent() {
    if (!parentEditCategoryId) return
    const selfId = parentEditCategoryId
    const nextParentId = parentEditValue || null

    if (nextParentId === selfId) {
      setParentEditError('Категорія не може бути батьківською сама для себе.')
      return
    }
    const descendants = descendantIdsById.get(selfId)
    if (nextParentId && descendants?.has(nextParentId)) {
      setParentEditError('Не можна вибрати підкатегорію як батьківську (циклічна структура).')
      return
    }

    await handleUpdate(selfId, 'parent_id', nextParentId)
    setParentEditCategoryId(null)
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function startAddSubcategory(parentId: string) {
    const parent = categories.find(c => c.id === parentId) ?? null
    if (!parent || parent.parent_id) return
    setExpanded(prev => ({ ...prev, [parentId]: true }))
    setAddingParentId(parentId)
    setAddingName('')
    setAddingError('')
  }

  // No fade/opacity effects — only layout shifts + height animation on enter/exit.

  return (
    <div className="fade-up-in">
      <div className="mb-6 fade-up-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Категорії</h1>
          <p className="text-sm text-text-muted">{categories.length} категорій</p>
        </div>
        <Button size="sm" onClick={() => openCreateCategoryModal(null)} className="shrink-0">
          + Додати категорію
        </Button>
      </div>

      <div className="bg-bg-surface border border-border rounded-md overflow-hidden transition-shadow duration-300 hover:shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[720px] text-sm">
            <div className="grid grid-cols-[1fr_120px_120px] border-b border-border">
              <div className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">
                Назва
              </div>
              <div className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">
                Порядок
              </div>
              <div className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider text-right">
                Дії
              </div>
            </div>

            <LayoutGroup>
              <AnimatePresence initial={false} mode="popLayout" presenceAffectsLayout>
                <motion.div
                  layout
                  className="divide-y divide-border"
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                {rows.map((row) => {
                if ((row as any).kind === 'add') {
                  const r = row as { id: string; kind: 'add'; parentId: string; depth: number }
                  const isNested = r.depth > 0
                  return (
                    <motion.div
                      key={r.id}
                      layout
                      initial={isNested ? { height: 0, y: -10 } : { height: 'auto', y: 0 }}
                      animate={{ height: 'auto', y: 0 }}
                      exit={isNested ? { height: 0, y: -10 } : { height: 'auto', y: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-bg-surface/40 overflow-hidden will-change-[height,transform]"
                    >
                      <div className="grid grid-cols-[1fr_120px_120px]">
                        <div className="px-4 py-3">
                          <div className="flex flex-col gap-1" style={{ paddingLeft: `${r.depth * 14}px` }}>
                          <div className="flex items-center gap-2">
                            <span className="size-6 shrink-0" />
                            <input
                              value={addingName}
                              onChange={(e) => setAddingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void createSubcategoryInline(r.parentId)
                                if (e.key === 'Escape') { setAddingParentId(null); setAddingName(''); setAddingError('') }
                              }}
                              autoFocus
                              placeholder="Назва підкатегорії…"
                              className="h-9 w-full max-w-sm rounded border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-muted"
                            />
                            <Button
                              size="sm"
                              onClick={() => void createSubcategoryInline(r.parentId)}
                              disabled={!addingName.trim() || addingSaving}
                              loading={addingSaving}
                            >
                              Додати
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setAddingParentId(null); setAddingName(''); setAddingError('') }}
                              disabled={addingSaving}
                            >
                              Скасувати
                            </Button>
                          </div>
                          {addingError && (
                            <p className="text-xs text-error pl-8">{addingError}</p>
                          )}
                        </div>
                        </div>
                        <div className="px-4 py-3" />
                        <div className="px-4 py-3" />
                      </div>
                    </motion.div>
                  )
                }

                const isEditingName = editingCell?.id === row.id && editingCell?.key === 'name_ua'
                const isEditingSort = editingCell?.id === row.id && editingCell?.key === 'sort_order'
                const childCount = childrenCountById.get(row.id) ?? 0
                const hasChildren = childCount > 0
                const isOpen = !!expanded[row.id]
                const canAddSubcategory = !row.parent_id
                const isNested = row.depth > 0
                return (
                  <motion.div
                    key={row.id}
                    layout
                    initial={isNested ? { height: 0, y: -10 } : { height: 'auto', y: 0 }}
                    animate={{ height: 'auto', y: 0 }}
                    exit={isNested ? { height: 0, y: -10 } : { height: 'auto', y: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'overflow-hidden',
                      'hover:bg-bg-elevated transition-colors duration-200 ease-out group',
                      'will-change-[height,transform]'
                    )}
                  >
                    <div className="grid grid-cols-[1fr_120px_120px]">
                    <div className="px-4 py-3">
                      {isEditingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                            autoFocus
                            className="h-7 bg-bg-elevated border border-accent rounded px-2 text-xs text-text-primary focus:outline-none w-56"
                          />
                          <button
                            onClick={() => void saveEdit()}
                            className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/cell">
                          <div
                            className="flex items-center gap-2 min-w-0"
                            style={{ paddingLeft: `${row.depth * 14}px` }}
                          >
                            <button
                              type="button"
                              onClick={() => { if (hasChildren) toggleExpanded(row.id) }}
                              className={cn(
                                'size-6 rounded flex items-center justify-center shrink-0',
                                hasChildren
                                  ? 'text-text-muted hover:text-text-primary hover:bg-bg-surface/60 transition-colors'
                                  : 'text-transparent'
                              )}
                              aria-label={hasChildren ? (isOpen ? 'Згорнути підкатегорії' : 'Розгорнути підкатегорії') : undefined}
                              title={hasChildren ? (isOpen ? 'Згорнути' : 'Розгорнути') : undefined}
                            >
                              {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                            </button>

                            <button
                              type="button"
                              onClick={() => { if (hasChildren) toggleExpanded(row.id) }}
                              className={cn(
                                'text-left rounded px-1 py-0.5 -mx-1 min-w-0',
                                hasChildren && 'hover:bg-bg-surface/60 transition-colors'
                              )}
                            >
                              <span className="text-sm text-text-primary truncate">
                                {row.name_ua}
                                {childCount > 0 && (
                                  <span className="ml-2 text-xs text-text-muted">({childCount})</span>
                                )}
                              </span>
                            </button>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(row, 'name_ua') }}
                            className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-accent transition-all rounded"
                            aria-label="Перейменувати"
                            title="Перейменувати"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      {isEditingSort ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                            autoFocus
                            className={cn(
                              'h-7 bg-bg-elevated border border-accent rounded px-2 text-xs text-text-primary focus:outline-none',
                              'w-16 text-center'
                            )}
                          />
                          <button
                            onClick={() => void saveEdit()}
                            className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/cell">
                          <span className="text-sm text-text-primary">{row.sort_order}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(row, 'sort_order') }}
                            className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-accent transition-all rounded"
                            aria-label="Змінити порядок"
                            title="Змінити порядок"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100">
                        {canAddSubcategory && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startAddSubcategory(row.id) }}
                            className={cn(
                              'p-1.5 rounded text-text-muted hover:text-accent',
                              'hover:bg-accent/10 transition-colors'
                            )}
                            aria-label="Додати підкатегорію"
                            title="Додати підкатегорію"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
                          className={cn(
                            'p-1.5 rounded text-text-muted hover:text-error',
                            'hover:bg-error/10 transition-colors'
                          )}
                          aria-label="Видалити"
                          title="Видалити"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                )
              })}

              {rows.length === 0 && (
                <motion.div
                  layout
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-12 text-center text-sm text-text-muted">
                    Немає даних
                  </div>
                </motion.div>
              )}
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </div>
      </div>
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
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            {(() => {
              const id = deleteCategoryId
              if (!id) return 'Підкатегорії (якщо є) залишаться, але стануть категоріями верхнього рівня.'
              const count = childrenCountById.get(id) ?? 0
              return count > 0
                ? `Після видалення: ${count} підкатегор${count === 1 ? 'ія' : count < 5 ? 'ії' : 'ій'} залишаться, але стануть категоріями верхнього рівня.`
                : 'Підкатегорій немає.'
            })()}
          </p>
          {deleteError && <p className="text-xs text-error">{deleteError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteCategoryId(null)}>
            Скасувати
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Видалити
          </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAddInfo}
        onClose={() => setShowAddInfo(false)}
        title="Додати категорію"
        description="Введіть назву категорії."
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
              placeholder="Напр. Паркувальні системи"
              autoFocus
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

      <Modal
        open={!!parentEditCategoryId}
        onClose={() => setParentEditCategoryId(null)}
        title="Батьківська категорія"
        description="Оберіть, до якої категорії належить ця підкатегорія."
        size="sm"
      >
        <div className="space-y-3">
          <div className="block">
            <span className="text-xs text-text-muted">Батьківська категорія</span>
            <CategoryCombobox
              categories={categories.filter(c => c.id !== parentEditCategoryId)}
              value={parentEditValue}
              onChange={(v) => { setParentEditValue(v); setParentEditError('') }}
              allowEmpty
              emptyLabel="Верхній рівень"
              className="mt-1"
              inputClassName="h-10"
            />
          </div>
          {parentEditError && <p className="text-xs text-error">{parentEditError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setParentEditCategoryId(null)}>
              Скасувати
            </Button>
            <Button onClick={saveParent}>
              Зберегти
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
