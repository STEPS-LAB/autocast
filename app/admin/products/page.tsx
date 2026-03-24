'use client'

import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { FilePenLine, Pencil, Percent, Plus } from 'lucide-react'
import AdminTable from '@/components/admin/AdminTable'
import { formatPrice, slugify } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Column } from '@/components/admin/AdminTable'
import type { Brand, Product } from '@/types'
import Image from 'next/image'
import { applyDiscountToProduct, clampDiscountPercent, salePriceFromPercent } from '@/lib/discounts'
import { selectDiscountOverrides, useDiscountStore } from '@/lib/store/discounts'
import type { Category } from '@/types'
import ImageCropModal from '@/components/admin/ImageCropModal'

type ProductRow = Product & { id: string }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [discountProductId, setDiscountProductId] = useState<string | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('0')
  const [newStock, setNewStock] = useState('0')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [createError, setCreateError] = useState('')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('0')
  const [editStock, setEditStock] = useState('0')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editBrandId, setEditBrandId] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editSpecsText, setEditSpecsText] = useState('')
  const [editError, setEditError] = useState('')
  const [editingImageProductId, setEditingImageProductId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [selectedFileName, setSelectedFileName] = useState('')
  const [cropSource, setCropSource] = useState('')
  const [cropFileName, setCropFileName] = useState('')
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(true)
  const overrides = useDiscountStore(selectDiscountOverrides)
  const setDiscountPercent = useDiscountStore(s => s.setDiscountPercent)
  const clearDiscount = useDiscountStore(s => s.clearDiscount)

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      const supabase = await getSupabase()
      const [{ data: productsData }, { data: categoriesData }, { data: brandsData }] = await Promise.all([
        supabase
          .from('products')
          .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id,slug,name_ua,parent_id,image_url,sort_order'),
        supabase.from('brands').select('id,name,logo_url').order('name', { ascending: true }),
      ])

      if (!isMounted) return
      setProducts((productsData as ProductRow[]) ?? [])
      setCategories((categoriesData as Category[]) ?? [])
      setBrands((brandsData as Brand[]) ?? [])
      setLoading(false)
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setProducts(prev => prev.map(p => applyDiscountToProduct(p, overrides)))
  }, [overrides])

  async function syncCatalogAfterChange() {
    try {
      await fetch('/api/admin/bootstrap', { method: 'POST' })
    } catch {
      // Ignore sync errors to keep CRUD responsive.
    }
  }

  async function handleUpdate(id: string, key: string, value: string | number) {
    const supabase = await getSupabase()
    await supabase.from('products').update({ [key]: value }).eq('id', id)
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [key]: value } : p
    ))
    await syncCatalogAfterChange()
  }

  function handleDelete(id: string) {
    setDeleteProductId(id)
  }

  async function confirmDelete() {
    if (!deleteProductId) return
    const id = deleteProductId
    const supabase = await getSupabase()
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setDeleteProductId(null)
    await syncCatalogAfterChange()
  }

  function openProductImageEditor(id: string) {
    const current = products.find(p => p.id === id)
    setEditingImageProductId(id)
    setPendingImages(current?.images ?? [])
    setSelectedFileName('')
    setCropSource('')
    setCropFileName('')
    setImageError('')
  }

  async function saveProductImage() {
    if (!editingImageProductId) return
    const product = products.find(p => p.id === editingImageProductId)
    if (!product) return
    const supabase = await getSupabase()

    const nextImages: string[] = []
    for (const image of pendingImages.slice(0, 6)) {
      if (!image.startsWith('data:')) {
        nextImages.push(image)
        continue
      }

      const uploadResponse = await fetch('/api/admin/upload-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: editingImageProductId,
          dataUrl: image,
        }),
      })

      const uploadResult = (await uploadResponse.json()) as { publicUrl?: string; error?: string }
      if (!uploadResponse.ok || !uploadResult.publicUrl) {
        setImageError(uploadResult.error ?? 'Не вдалося завантажити зображення у storage.')
        return
      }

      nextImages.push(uploadResult.publicUrl)
    }

    await supabase.from('products').update({ images: nextImages }).eq('id', editingImageProductId)
    setProducts(prev => prev.map(p =>
      p.id === editingImageProductId
        ? { ...p, images: nextImages }
        : p
    ))
    setEditingImageProductId(null)
    await syncCatalogAfterChange()
  }

  function handleProductImageFileChange(event: ChangeEvent<HTMLInputElement>) {
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
    setPendingImages(prev => [croppedImage, ...prev].slice(0, 6))
    setSelectedFileName(cropFileName)
    closeCropper()
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

  const columns: Column<ProductRow>[] = [
    {
      key: 'images',
      label: 'Фото',
      render: (row) => (
        <div className="flex items-center gap-1.5 group/cell">
          {row.images[0] ? (
            <div className="relative size-10 rounded overflow-hidden bg-bg-elevated border border-border shrink-0">
              <Image src={row.images[0]} alt={row.name_ua} fill className="object-cover" sizes="40px" />
            </div>
          ) : (
            <div className="size-10 rounded bg-bg-elevated border border-border" />
          )}
          <button
            onClick={() => openProductImageEditor(row.id)}
            className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-accent transition-all rounded"
            aria-label="Редагувати зображення"
            title="Редагувати зображення"
          >
            <Pencil size={11} />
          </button>
        </div>
      ),
    },
    {
      key: 'name_ua',
      label: 'Назва',
      editable: true,
      render: (row) => (
        <div className="max-w-[240px]">
          <p className="text-sm text-text-primary line-clamp-2">{row.name_ua}</p>
        </div>
      ),
    },
    {
      key: 'category_id',
      label: 'Категорія',
      render: (row) => {
        const cat = categories.find(c => c.id === row.category_id)
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
        <div className={row.stock === 0 ? 'rounded border border-error/40 bg-error/10 px-2 py-1 inline-flex' : ''}>
          <Badge variant={row.stock > 5 ? 'success' : row.stock > 0 ? 'warning' : 'error'}>
            {row.stock} шт.
          </Badge>
        </div>
      ),
    },
  ]

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) => {
      const categoryName = categories.find(c => c.id === product.category_id)?.name_ua ?? ''
      const brandName = brands.find(b => b.id === product.brand_id)?.name ?? ''
      return (
        product.name_ua.toLowerCase().includes(query)
        || product.description_ua.toLowerCase().includes(query)
        || categoryName.toLowerCase().includes(query)
        || brandName.toLowerCase().includes(query)
      )
    })
  }, [brands, categories, products, searchQuery])

  function handleDiscount(row: ProductRow) {
    const currentPercent = row.sale_price
      ? Math.round(((row.price - row.sale_price) / row.price) * 100)
      : 0
    setDiscountProductId(row.id)
    setDiscountInput(String(currentPercent))
    setDiscountError('')
  }

  async function applyDiscountFromModal() {
    if (!discountProductId) return
    const supabase = await getSupabase()
    const parsed = Number(discountInput.trim())
    if (!Number.isFinite(parsed)) {
      setDiscountError('Введіть коректне число.')
      return
    }

    const percent = clampDiscountPercent(parsed)
    if (percent === 0) {
      await supabase.from('products').update({ sale_price: null }).eq('id', discountProductId)
      setProducts(prev => prev.map(p => (p.id === discountProductId ? { ...p, sale_price: null } : p)))
      clearDiscount(discountProductId)
      setDiscountProductId(null)
      await syncCatalogAfterChange()
      return
    }

    const row = products.find(p => p.id === discountProductId)
    if (!row) return
    const nextSalePrice = salePriceFromPercent(row.price, percent)
    await supabase.from('products').update({ sale_price: nextSalePrice }).eq('id', discountProductId)
    setProducts(prev => prev.map(p =>
      p.id === discountProductId
        ? { ...p, sale_price: nextSalePrice }
        : p
    ))
    setDiscountPercent(discountProductId, percent)
    setDiscountProductId(null)
    await syncCatalogAfterChange()
  }

  function openCreateProductModal() {
    setNewName('')
    setNewPrice('0')
    setNewStock('0')
    setNewCategoryId(categories[0]?.id ?? '')
    setCreateError('')
    setShowAddInfo(true)
  }

  async function createProduct() {
    const name = newName.trim()
    if (!name) {
      setCreateError('Вкажіть назву товару.')
      return
    }
    const categoryId = newCategoryId || categories[0]?.id
    if (!categoryId) {
      setCreateError('Немає доступної категорії.')
      return
    }

    const payload = {
      slug: slugify(name),
      name_ua: name,
      description_ua: '',
      price: Math.max(0, Number(newPrice || '0')),
      sale_price: null,
      stock: Math.max(0, Number(newStock || '0')),
      category_id: categoryId,
      brand_id: null,
      specs: {},
      images: [],
      is_featured: false,
    }

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at')
      .single()

    if (error || !data) {
      setCreateError('Не вдалося створити товар.')
      return
    }

    setProducts(prev => [data as ProductRow, ...prev])
    setShowAddInfo(false)
    await syncCatalogAfterChange()
  }

  function specsToText(specs: Record<string, string>): string {
    return Object.entries(specs).map(([key, value]) => `${key}: ${value}`).join('\n')
  }

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

  function openEditProductModal(row: ProductRow) {
    setEditingProductId(row.id)
    setEditName(row.name_ua)
    setEditDescription(row.description_ua)
    setEditPrice(String(row.price))
    setEditStock(String(row.stock))
    setEditCategoryId(row.category_id)
    setEditBrandId(row.brand_id ?? '')
    setEditFeatured(row.is_featured)
    setEditSpecsText(specsToText(row.specs ?? {}))
    setEditError('')
  }

  async function saveProductDetails() {
    if (!editingProductId) return
    const name = editName.trim()
    if (!name) {
      setEditError('Назва є обовʼязковою.')
      return
    }

    const payload = {
      name_ua: name,
      slug: slugify(name),
      description_ua: editDescription.trim(),
      price: Math.max(0, Number(editPrice || '0')),
      stock: Math.max(0, Number(editStock || '0')),
      category_id: editCategoryId,
      brand_id: editBrandId || null,
      is_featured: editFeatured,
      specs: textToSpecs(editSpecsText),
    }

    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editingProductId)
      .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at')
      .single()

    if (error || !data) {
      setEditError('Не вдалося зберегти зміни.')
      return
    }

    setProducts(prev => prev.map(p => p.id === editingProductId ? data as ProductRow : p))
    setEditingProductId(null)
    await syncCatalogAfterChange()
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Товари</h1>
          <p className="text-sm text-text-muted">{filteredProducts.length} товарів</p>
        </div>
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="products-search">Пошук товарів</label>
          <input
            id="products-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук товарів..."
            className="w-full h-9 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
          />
        </div>
        <Button size="sm" onClick={openCreateProductModal} className="gap-1.5 shrink-0">
          <Plus size={14} />
          Додати товар
        </Button>
      </div>

      <AdminTable
        data={filteredProducts}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        actionsAlwaysVisible
        renderActions={(row) => (
          <>
            <button
              onClick={() => openEditProductModal(row)}
              className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Редагувати товар"
              title="Редагувати товар"
            >
              <FilePenLine size={14} />
            </button>
            <button
              onClick={() => handleDiscount(row)}
              className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Додати знижку"
              title="Додати знижку"
            >
              <Percent size={14} />
            </button>
          </>
        )}
      />
      {loading && (
        <p className="text-sm text-text-muted mt-3">Завантаження...</p>
      )}

      <Modal
        open={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        title="Видалити товар?"
        description="Цю дію неможливо скасувати."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteProductId(null)}>
            Скасувати
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Видалити
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!discountProductId}
        onClose={() => {
          setDiscountProductId(null)
          setDiscountError('')
        }}
        title="Налаштувати знижку"
        description="Вкажіть % знижки. Значення 0 прибирає знижку."
        size="sm"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-text-muted">Знижка, %</span>
            <input
              type="number"
              min={0}
              max={95}
              value={discountInput}
              onChange={(e) => {
                setDiscountInput(e.target.value)
                setDiscountError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyDiscountFromModal()
              }}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </label>
          {discountError && (
            <p className="text-xs text-error">{discountError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDiscountProductId(null)}>
              Скасувати
            </Button>
            <Button onClick={applyDiscountFromModal}>
              Застосувати
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editingProductId}
        onClose={() => setEditingProductId(null)}
        title="Редагувати товар"
        description="Змінюйте розширені параметри товару."
        size="md"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="text-xs text-text-muted">Назва</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs text-text-muted">Опис</span>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary resize-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Ціна</span>
              <input
                type="number"
                min={0}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Залишок</span>
              <input
                type="number"
                min={0}
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Категорія</span>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_ua}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Бренд</span>
              <select
                value={editBrandId}
                onChange={(e) => setEditBrandId(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              >
                <option value="">Без бренду</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block col-span-2">
              <span className="text-xs text-text-muted">Характеристики (формат: Ключ: Значення)</span>
              <textarea
                rows={4}
                value={editSpecsText}
                onChange={(e) => setEditSpecsText(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary font-mono resize-y"
                placeholder={'Потужність: 4x50 Вт\nBluetooth: Так'}
              />
            </label>
            <label className="col-span-2 flex items-center gap-2 rounded border border-border bg-bg-elevated px-3 py-2">
              <input
                type="checkbox"
                checked={editFeatured}
                onChange={(e) => setEditFeatured(e.target.checked)}
                className="size-4 accent-accent"
              />
              <span className="text-sm text-text-primary">Показувати як топовий товар</span>
            </label>
          </div>
          {editError && <p className="text-xs text-error">{editError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingProductId(null)}>
              Скасувати
            </Button>
            <Button onClick={saveProductDetails}>
              Зберегти зміни
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAddInfo}
        onClose={() => setShowAddInfo(false)}
        title="Додати товар"
        description="Створіть новий товар у каталозі."
        size="sm"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-text-muted">Назва</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-text-muted">Ціна</span>
              <input
                type="number"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Залишок</span>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-text-muted">Категорія</span>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ua}
                </option>
              ))}
            </select>
          </label>
          {createError && <p className="text-xs text-error">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddInfo(false)}>
              Скасувати
            </Button>
            <Button onClick={createProduct}>Створити</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editingImageProductId}
        onClose={() => setEditingImageProductId(null)}
        title="Редагувати зображення товару"
        description="Завантажте зображення з пристрою."
        size="sm"
      >
        <div className="space-y-3">
          {pendingImages.length > 0 && (
            <div className="rounded border border-border bg-bg-elevated p-2">
              <p className="text-xs text-text-muted mb-2">Галерея товару (перше фото — головне)</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pendingImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="flex items-center gap-2 rounded border border-border bg-bg-surface p-1.5">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs text-text-muted">Файл зображення</span>
            <div className="mt-1 h-10 w-full rounded border border-border bg-bg-elevated px-2 flex items-center gap-2">
              <label
                htmlFor="product-image-upload"
                className="inline-flex h-7 items-center rounded border border-border px-2.5 text-xs text-text-primary bg-bg-surface hover:bg-bg-primary cursor-pointer shrink-0"
              >
                Вибрати файл
              </label>
              <span className="text-sm text-text-secondary truncate">
                {selectedFileName || 'Файл не вибрано (до 6 фото)'}
              </span>
              <input
                id="product-image-upload"
                type="file"
                accept="image/*"
                onChange={handleProductImageFileChange}
                className="sr-only"
              />
            </div>
          </label>
          {imageError && (
            <p className="text-xs text-error">{imageError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingImageProductId(null)}>
              Скасувати
            </Button>
            <Button onClick={saveProductImage}>
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
