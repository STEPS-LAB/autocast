'use client'

import { type ChangeEvent, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import AdminTable from '@/components/admin/AdminTable'
import Image from 'next/image'
import type { Category } from '@/types'
import type { Column } from '@/components/admin/AdminTable'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ImageCropModal from '@/components/admin/ImageCropModal'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { slugify } from '@/lib/utils'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [newCategorySortOrder, setNewCategorySortOrder] = useState('0')
  const [editingImageCategoryId, setEditingImageCategoryId] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<string>('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [cropSource, setCropSource] = useState('')
  const [cropFileName, setCropFileName] = useState('')
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true
    async function loadCategories() {
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
  }, [supabase])

  async function handleUpdate(id: string, key: string, value: string | number) {
    await supabase.from('categories').update({ [key]: value }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
  }

  function handleDelete(id: string) {
    setDeleteCategoryId(id)
  }

  async function confirmDelete() {
    if (!deleteCategoryId) return
    const id = deleteCategoryId
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteCategoryId(null)
  }

  function openImageEditor(id: string) {
    const current = categories.find(c => c.id === id)
    setEditingImageCategoryId(id)
    setPendingImage(current?.image_url ?? '')
    setSelectedFileName('')
    setCropSource('')
    setCropFileName('')
    setImageError('')
  }

  function openCreateCategoryModal() {
    const nextSort = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order)) + 1
      : 1
    setNewCategoryName('')
    setNewCategorySlug('')
    setNewCategorySortOrder(String(nextSort))
    setShowAddInfo(true)
  }

  async function createCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    const slug = (newCategorySlug.trim() || slugify(name))
    const sortOrder = Math.max(0, Number(newCategorySortOrder || '0'))
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
    }
  }

  async function saveCategoryImage() {
    if (!editingImageCategoryId) return
    const category = categories.find(c => c.id === editingImageCategoryId)
    if (!category) return

    if (!pendingImage) {
      await supabase.from('categories').update({ image_url: null }).eq('id', editingImageCategoryId)
      setCategories(prev => prev.map(c =>
        c.id === editingImageCategoryId ? { ...c, image_url: null } : c
      ))
      setEditingImageCategoryId(null)
      return
    }

    const blob = await (await fetch(pendingImage)).blob()
    const extension = blob.type.includes('png') ? 'png' : 'jpg'
    const path = `${editingImageCategoryId}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })

    if (uploadError) {
      setImageError('Не вдалося завантажити зображення у storage.')
      return
    }

    const { data: publicData } = supabase.storage.from('category-images').getPublicUrl(path)
    const imageUrl = publicData.publicUrl || category.image_url
    await supabase.from('categories').update({ image_url: imageUrl }).eq('id', editingImageCategoryId)

    setCategories(prev => prev.map(c =>
      c.id === editingImageCategoryId ? { ...c, image_url: imageUrl } : c
    ))
    setEditingImageCategoryId(null)
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('Оберіть файл зображення.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result)
        setCropFileName(file.name)
        setImageError('')
      }
    }
    reader.onerror = () => {
      setImageError('Не вдалося прочитати файл. Спробуйте інший.')
    }
    reader.readAsDataURL(file)
  }

  function closeCropper() {
    setCropSource('')
    setCropFileName('')
  }

  function applyCroppedImage(croppedImage: string) {
    setPendingImage(croppedImage)
    setSelectedFileName(cropFileName)
    closeCropper()
  }

  const columns: Column<Category>[] = [
    {
      key: 'image_url',
      label: 'Зображення',
      render: (row) => (
        <div className="flex items-center gap-1.5 group/cell">
          {row.image_url ? (
            <div className="relative size-10 rounded overflow-hidden bg-bg-elevated border border-border">
              <Image src={row.image_url} alt={row.name_ua} fill className="object-cover" sizes="40px" />
            </div>
          ) : (
            <div className="size-10 rounded bg-bg-elevated border border-border" />
          )}
          <button
            onClick={() => openImageEditor(row.id)}
            className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-accent transition-all rounded"
            aria-label="Редагувати зображення"
            title="Редагувати зображення"
          >
            <Pencil size={11} />
          </button>
        </div>
      ),
    },
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
        onAdd={openCreateCategoryModal}
        addLabel="Додати категорію"
      />
      {loading && (
        <p className="text-sm text-text-muted mt-3">Завантаження...</p>
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
              onChange={(e) => {
                const value = e.target.value
                setNewCategoryName(value)
                setNewCategorySlug(slugify(value))
              }}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              placeholder="Напр. Автосвітло"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Slug</span>
            <input
              type="text"
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              placeholder="avtosvitlo"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Порядок</span>
            <input
              type="number"
              min={0}
              value={newCategorySortOrder}
              onChange={(e) => setNewCategorySortOrder(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
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
        open={!!editingImageCategoryId}
        onClose={() => setEditingImageCategoryId(null)}
        title="Редагувати зображення"
        description="Завантажте зображення з пристрою."
        size="sm"
      >
        <div className="space-y-3">
          {pendingImage && (
            <div className="flex items-center gap-3 rounded border border-border bg-bg-elevated p-2">
              <div className="relative size-14 rounded overflow-hidden border border-border shrink-0">
                <Image src={pendingImage} alt="Попередній перегляд" fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-muted">Попередній перегляд</p>
                <button
                  type="button"
                  onClick={() => {
                    setPendingImage('')
                    setSelectedFileName('')
                  }}
                  className="mt-1 text-xs text-error hover:underline"
                >
                  Прибрати зображення
                </button>
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs text-text-muted">Файл зображення</span>
            <div className="mt-1 h-10 w-full rounded border border-border bg-bg-elevated px-2 flex items-center gap-2">
              <label
                htmlFor="category-image-upload"
                className="inline-flex h-7 items-center rounded border border-border px-2.5 text-xs text-text-primary bg-bg-surface hover:bg-bg-primary cursor-pointer shrink-0"
              >
                Вибрати файл
              </label>
              <span className="text-sm text-text-secondary truncate">
                {selectedFileName || 'Файл не вибрано'}
              </span>
              <input
                id="category-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="sr-only"
              />
            </div>
          </label>
          {imageError && (
            <p className="text-xs text-error">{imageError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingImageCategoryId(null)}>
              Скасувати
            </Button>
            <Button onClick={saveCategoryImage}>
              Зберегти
            </Button>
          </div>
        </div>
      </Modal>

      <ImageCropModal
        open={!!cropSource}
        imageSrc={cropSource}
        onClose={closeCropper}
        onApply={applyCroppedImage}
      />
    </div>
  )
}
