'use client'

import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import ImageCropModal from '@/components/admin/ImageCropModal'
import BrandCombobox from '@/components/admin/BrandCombobox'
import { mergeBrandIntoList, resolveBrandId } from '@/lib/admin/resolve-brand'
import type { Brand, Category } from '@/types'
import { slugify } from '@/lib/utils'

function textToSpecs(text: string): Record<string, string> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const specs: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key && value) specs[key] = value
  }
  return specs
}

async function getSupabase() {
  const mod = await import('@/lib/supabase/client')
  return mod.createClient()
}

export default function AdminNewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [featured, setFeatured] = useState(false)
  const [specsText, setSpecsText] = useState('')

  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [cropSource, setCropSource] = useState('')
  const [cropFileName, setCropFileName] = useState('')
  const [imageError, setImageError] = useState('')
  const imageCropQueueRef = useRef<string[]>([])

  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const isCropping = !!cropSource
  const totalImagesSelected =
    pendingImages.length + (cropSource ? 1 : 0) + imageCropQueueRef.current.length

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = await getSupabase()
      const [{ data: cat }, { data: br }] = await Promise.all([
        supabase.from('categories').select('id,slug,name_ua,parent_id,image_url,sort_order').order('sort_order', { ascending: true }),
        supabase.from('brands').select('id,name,logo_url').order('name', { ascending: true }),
      ])
      if (!mounted) return
      const c = (cat as Category[]) ?? []
      setCategories(c)
      setBrands((br as Brand[]) ?? [])
      setCategoryId('')
      setLoading(false)
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  async function syncCatalogAfterChange() {
    try {
      await fetch('/api/admin/bootstrap', { method: 'POST' })
    } catch {
      // ignore
    }
  }

  function openNextInCropQueue() {
    const tail = imageCropQueueRef.current
    if (tail.length === 0) {
      setCropSource('')
      setCropFileName('')
      imageCropQueueRef.current = []
      return
    }
    const [head, ...rest] = tail
    if (head === undefined) {
      setCropSource('')
      setCropFileName('')
      imageCropQueueRef.current = []
      return
    }
    imageCropQueueRef.current = rest
    setCropSource(head)
    setCropFileName(rest.length > 0 ? `Ще ${rest.length + 1} у черзі` : '')
  }

  async function handleProductImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    // Some devices/browsers may provide an empty or unexpected MIME type for images.
    // We avoid dropping such files early; instead we validate after FileReader
    // by checking that we got a `data:image/...` URL.
    const imageFiles = files.filter(f => {
      const t = f.type || ''
      return t === '' || t.startsWith('image/')
    })

    if (imageFiles.length === 0) {
      setImageError('Оберіть файли зображень.')
      return
    }

    const room = Math.max(0, 6 - pendingImages.length)
    if (room === 0) {
      setImageError('У галереї вже максимум 6 фото.')
      return
    }

    const toRead = imageFiles.slice(0, room)
    setImageError(
      imageFiles.length > room
        ? `Обрано ${imageFiles.length} зображень; додано до кадрування перші ${room} (макс. 6 у галереї).`
        : ''
    )

    try {
      const dataUrls = await Promise.all(
        toRead.map(
          file =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                if (typeof reader.result === 'string') resolve(reader.result)
                else reject(new Error('read'))
              }
              reader.onerror = () => reject(new Error('read'))
              reader.readAsDataURL(file)
            })
        )
      )

      const validDataUrls = dataUrls.filter((u): u is string => typeof u === 'string' && u.startsWith('data:image/'))
      const first = validDataUrls[0]
      if (!first) {
        setImageError('Не вдалося прочитати вибрані зображення. Спробуйте інші файли.')
        return
      }

      if (validDataUrls.length !== toRead.length) {
        setImageError(
          `Розпізнано як зображення ${validDataUrls.length} з ${toRead.length}. Для решти файлів не вдалося отримати data:image/...`
        )
      }

      imageCropQueueRef.current = validDataUrls.slice(1)
      setCropSource(first)
      setCropFileName(validDataUrls.length > 1 ? `${validDataUrls.length} зображень обрано` : toRead[0]!.name)
    } catch {
      setImageError('Не вдалося прочитати файли. Спробуйте інші.')
    }
  }

  function closeCropper() {
    openNextInCropQueue()
  }

  function applyCroppedImage(croppedImage: string) {
    // Add cropped image to gallery and immediately move to the next
    // one in the queue (avoid queueMicrotask to prevent race conditions).
    // Keep order: first selected image should be "головне" (index 0).
    // Therefore we append new cropped images to the end, so later uploads
    // become the last items in the gallery.
    setPendingImages(prev => [...prev, croppedImage].slice(0, 6))
    openNextInCropQueue()
  }

  function movePendingImage(index: number, direction: -1 | 1) {
    setPendingImages(prev => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      if (item === undefined) return prev
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function removePendingImage(index: number) {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError('Вкажіть назву товару.')
      return
    }
    if (!categoryId) {
      setFormError(categories.length === 0
        ? 'Спочатку створіть категорію у розділі «Категорії».'
        : 'Оберіть категорію.')
      return
    }
    const cat = categoryId

    setSaving(true)
    try {
      const supabase = await getSupabase()
      let finalBrandId: string | null = null
      try {
        const { brandId: rid, newBrand } = await resolveBrandId(supabase, brands, brandInput)
        finalBrandId = rid
        if (newBrand) setBrands(prev => mergeBrandIntoList(prev, newBrand))
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Не вдалося зберегти бренд.')
        setSaving(false)
        return
      }

      const payload = {
        slug: slugify(trimmedName),
        name_ua: trimmedName,
        description_ua: description.trim(),
        price: Math.max(0, Number(price || '0')),
        sale_price: null as number | null,
        stock: Math.max(0, Number(stock || '0')),
        category_id: cat,
        brand_id: finalBrandId,
        specs: textToSpecs(specsText),
        images: [] as string[],
        is_featured: featured,
      }

      const { data: created, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single()

      if (insertError || !created) {
        setFormError(
          insertError?.message?.includes('duplicate') || insertError?.message?.includes('unique')
            ? 'Товар із таким slug уже існує. Змініть назву.'
            : 'Не вдалося створити товар.'
        )
        return
      }

      const productId = created.id as string
      const nextImages: string[] = []

      for (const image of pendingImages.slice(0, 6)) {
        if (!image.startsWith('data:')) {
          nextImages.push(image)
          continue
        }

        const uploadResponse = await fetch('/api/admin/upload-product-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, dataUrl: image }),
        })
        const uploadResult = (await uploadResponse.json()) as { publicUrl?: string; error?: string }
        if (!uploadResponse.ok || !uploadResult.publicUrl) {
          setImageError(uploadResult.error ?? 'Не вдалося завантажити зображення.')
          await supabase.from('products').delete().eq('id', productId)
          setFormError('Товар не збережено через помилку завантаження фото. Спробуйте ще раз.')
          return
        }
        nextImages.push(uploadResult.publicUrl)
      }

      if (nextImages.length > 0) {
        await supabase.from('products').update({ images: nextImages }).eq('id', productId)
      }

      await syncCatalogAfterChange()
      router.push('/admin/products')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-text-muted">Завантаження...</p>
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        До списку товарів
      </Link>

      <h1 className="text-xl font-bold text-text-primary mb-1">Новий товар</h1>
      <p className="text-sm text-text-muted mb-8">Заповніть усі поля та збережіть товар.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-md border border-border bg-bg-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Зображення</h2>
          {pendingImages.length > 0 && (
            <div className="rounded border border-border bg-bg-input p-2">
              <p className="text-xs text-text-muted mb-2">Галерея товару (перше фото — головне)</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pendingImages.map((image, index) => (
                  <motion.div
                    key={image}
                    layout
                    initial={false}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="flex items-center gap-2 rounded border border-border bg-bg-surface p-1.5"
                  >
                    <div className="relative size-12 rounded overflow-hidden border border-border shrink-0">
                      <Image src={image} alt={`Фото ${index + 1}`} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-secondary truncate">
                        Фото {index + 1} {index === 0 ? '(головне)' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => movePendingImage(index, -1)}
                        disabled={index === 0}
                        className="h-7 px-2 rounded border border-border text-xs text-text-secondary disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => movePendingImage(index, 1)}
                        disabled={index === pendingImages.length - 1}
                        className="h-7 px-2 rounded border border-border text-xs text-text-secondary disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removePendingImage(index)}
                        className="h-7 px-2 rounded border border-error/30 text-xs text-error"
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs text-text-muted">Файл зображення</span>
            <p className="text-xs text-text-muted mt-0.5 mb-1">JPEG, PNG або WebP, до 6 файлів за раз.</p>
            <div className="mt-1 h-10 w-full rounded border border-border bg-bg-input px-2 flex items-center gap-2 max-w-md">
              <label
                htmlFor="new-product-image-upload"
                className="inline-flex h-7 items-center rounded border border-border px-2.5 text-xs text-text-primary bg-bg-surface hover:bg-bg-primary cursor-pointer shrink-0"
              >
                Вибрати файли
              </label>
              <span className="text-sm text-text-secondary truncate">
                {totalImagesSelected > 0
                  ? `${totalImagesSelected} зображень`
                  : 'Файли не вибрано (до 6 фото, можна кілька)'}
              </span>
              <input
                id="new-product-image-upload"
                type="file"
                accept="image/*"
                multiple
                disabled={isCropping}
                onChange={handleProductImageFileChange}
                className="sr-only"
              />
            </div>
          </label>
          {imageError && <p className="text-xs text-error">{imageError}</p>}
        </div>

        <div className="rounded-md border border-border bg-bg-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Основне</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block md:col-span-2">
              <span className="text-xs text-text-muted">Назва</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Напр. Alpine iLX-F115D 2DIN"
                className="mt-1 w-full h-10 rounded border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-muted"
                required
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-text-muted">Опис</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Короткий опис для картки товару та детальна інформація про комплектацію, сумісність тощо."
                className="mt-1 w-full rounded border border-border bg-bg-input px-3 py-2 text-sm text-text-primary resize-y placeholder:text-text-muted"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Ціна</span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Напр. 12999"
                className="mt-1 w-full h-10 rounded border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-muted"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Залишок</span>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Кількість одиниць на складі"
                className="mt-1 w-full h-10 rounded border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-muted"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Категорія</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                title="Оберіть розділ каталогу"
                className="mt-1 w-full h-10 rounded border border-border bg-bg-input px-3 text-sm text-text-primary"
              >
                <option value="" disabled>
                  Оберіть категорію
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_ua}
                  </option>
                ))}
              </select>
            </label>
            <div className="block">
              <span className="text-xs text-text-muted">Бренд</span>
              <BrandCombobox
                brands={brands}
                value={brandInput}
                onChange={setBrandInput}
                placeholder="Без бренду (необов’язково) — введіть або оберіть"
                className="mt-1"
                inputClassName="h-10"
              />
            </div>
            <label className="block md:col-span-2">
              <span className="text-xs text-text-muted">Характеристики (формат: Ключ: Значення)</span>
              <textarea
                rows={5}
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg-input px-3 py-2 text-sm text-text-primary font-mono resize-y placeholder:text-text-muted"
                placeholder={'Кожен рядок: «Назва: значення».\nПотужність: 4×50 Вт\nBluetooth: Так\nДіагональ екрану: 10″'}
              />
            </label>
            <label
              className="flex items-center gap-2 rounded border border-border bg-bg-input px-3 py-2 md:col-span-2 cursor-pointer"
              title="Товар може з’являтися у блоці топ-товарів на головній та в адмін-дашборді"
            >
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 accent-accent"
              />
              <span className="text-sm text-text-primary">Показувати як топовий товар</span>
            </label>
          </div>
        </div>

        {formError && (
          <p className="text-sm text-error bg-error/10 border border-error/20 rounded px-3 py-2">{formError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving} disabled={isCropping}>
            Зберегти товар
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>
            Скасувати
          </Button>
        </div>
      </form>

      <ImageCropModal
        open={!!cropSource}
        imageSrc={cropSource}
        onClose={closeCropper}
        onApply={applyCroppedImage}
      />
    </div>
  )
}
