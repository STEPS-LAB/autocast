'use client'

import { type ChangeEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Pencil, Percent, Plus, Upload } from 'lucide-react'
import AdminTable from '@/components/admin/AdminTable'
import { cn } from '@/lib/utils'
import { useAdminPrice } from '@/lib/hooks/useAdminPrice'
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
import Pagination from '@/components/ui/Pagination'
import { clampPage, paginateSlice, pageRangeLabel, ADMIN_PRODUCTS_PAGE_SIZE } from '@/lib/pagination'

type ProductRow = Product & { id: string }

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-text-muted">Завантаження товарів...</p>}>
      <AdminProductsPageInner />
    </Suspense>
  )
}

function AdminProductsPageInner() {
  const MAX_IMAGES = 10
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const importRefreshKey = searchParams.get('imported')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [discountProductId, setDiscountProductId] = useState<string | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingImageProductId, setEditingImageProductId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [selectedFileName, setSelectedFileName] = useState('')
  const [cropSource, setCropSource] = useState('')
  const [cropFileName, setCropFileName] = useState('')
  const [imageError, setImageError] = useState('')
  const imageCropQueueRef = useRef<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(1)
  const overrides = useDiscountStore(selectDiscountOverrides)
  const setDiscountPercent = useDiscountStore(s => s.setDiscountPercent)
  const clearDiscount = useDiscountStore(s => s.clearDiscount)
  const { formatDual } = useAdminPrice()

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch('/api/admin/products', { cache: 'no-store' })
        const payload = await response.json() as {
          error?: string
          products?: ProductRow[]
          categories?: Category[]
          brands?: Brand[]
        }

        if (!isMounted) return

        if (!response.ok) {
          setLoadError(payload.error ?? 'Не вдалося завантажити товари.')
          setProducts([])
          return
        }

        setProducts(payload.products ?? [])
        setCategories(payload.categories ?? [])
        setBrands(payload.brands ?? [])
      } catch (error) {
        if (!isMounted) return
        setLoadError(error instanceof Error ? error.message : 'Не вдалося завантажити товари.')
        setProducts([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [importRefreshKey, pathname])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

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
    imageCropQueueRef.current = []
  }

  async function saveProductImage() {
    if (!editingImageProductId) return
    const product = products.find(p => p.id === editingImageProductId)
    if (!product) return
    const supabase = await getSupabase()

    const nextImages: string[] = []
    for (const image of pendingImages.slice(0, MAX_IMAGES)) {
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

    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setImageError('Оберіть файли зображень.')
      return
    }

    const room = Math.max(0, MAX_IMAGES - pendingImages.length)
    if (room === 0) {
      setImageError(`У галереї вже максимум ${MAX_IMAGES} фото.`)
      return
    }

    const toRead = imageFiles.slice(0, room)
    setImageError(
      imageFiles.length > room
        ? `Обрано ${imageFiles.length} зображень; додано до кадрування перші ${room} (макс. ${MAX_IMAGES} у галереї).`
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

      const first = dataUrls[0]
      if (!first) return
      imageCropQueueRef.current = dataUrls.slice(1)
      setCropSource(first)
      setCropFileName(toRead.length > 1 ? `${toRead.length} зображень обрано` : toRead[0]!.name)
      setSelectedFileName(toRead.length > 1 ? `${toRead.length} зображень` : toRead[0]!.name)
    } catch {
      setImageError('Не вдалося прочитати файли. Спробуйте інші.')
    }
  }

  function closeCropper() {
    openNextInCropQueue()
  }

  function applyCroppedImage(croppedImage: string) {
    setPendingImages(prev => {
      const next = [croppedImage, ...prev].slice(0, MAX_IMAGES)
      if (next.length >= MAX_IMAGES) {
        imageCropQueueRef.current = []
        queueMicrotask(() => {
          setCropSource('')
          setCropFileName('')
        })
      }
      else {
        queueMicrotask(() => openNextInCropQueue())
      }
      return next
    })
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
          <span className="text-sm font-semibold text-text-primary price">{formatDual(row.price)}</span>
          {row.sale_price && (
            <p className="text-xs text-accent price">{formatDual(row.sale_price)}</p>
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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ADMIN_PRODUCTS_PAGE_SIZE))
  const currentPage = clampPage(page, totalPages)
  const paginatedProducts = useMemo(
    () => paginateSlice(filteredProducts, currentPage, ADMIN_PRODUCTS_PAGE_SIZE),
    [filteredProducts, currentPage]
  )

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  const productForDiscount = useMemo(
    () => products.find(p => p.id === discountProductId) ?? null,
    [products, discountProductId],
  )

  const parsedDiscountPercent = Number(discountInput.trim())
  const discountPercentForUi = Number.isFinite(parsedDiscountPercent)
    ? clampDiscountPercent(parsedDiscountPercent)
    : null
  const discountedPriceForUi =
    productForDiscount && discountPercentForUi !== null
      ? salePriceFromPercent(productForDiscount.price, discountPercentForUi)
      : null

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

  function openEditProductModal(row: ProductRow) {
    router.push(`/admin/products/new?edit=${encodeURIComponent(row.id)}`)
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Товари</h1>
          <p className="text-sm text-text-muted">
            {loading
              ? 'Завантаження...'
              : filteredProducts.length > ADMIN_PRODUCTS_PAGE_SIZE
                ? `${filteredProducts.length} товарів · ${pageRangeLabel(currentPage, ADMIN_PRODUCTS_PAGE_SIZE, filteredProducts.length)}`
                : `${filteredProducts.length} товарів`}
          </p>
          {loadError && (
            <p className="text-sm text-red-500 mt-1">{loadError}</p>
          )}
        </div>
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="products-search">Пошук товарів</label>
          <input
            id="products-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук товарів..."
            className="w-full h-9 rounded border border-border bg-bg-input px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/products/import"
            className={cn(
              'inline-flex items-center justify-center font-medium rounded transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
              'border border-border bg-bg-surface text-text-primary hover:bg-bg-elevated',
              'h-8 px-3 text-sm gap-1.5'
            )}
          >
            <Upload size={14} />
            Імпорт
          </Link>
          <Link
            href="/admin/products/new"
            className={cn(
              'inline-flex items-center justify-center font-medium rounded transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
              'bg-accent text-text-primary hover:bg-accent-hover active:scale-[0.98] shadow-sm',
              'h-8 px-3 text-sm gap-1.5'
            )}
          >
            <Plus size={14} />
            Додати товар
          </Link>
        </div>
      </div>

      <AdminTable
        data={paginatedProducts}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        rowHref={(row) => `/admin/products/new?edit=${encodeURIComponent(row.id)}`}
        actionsAlwaysVisible
        renderActions={(row) => (
          <>
            <button
              onClick={() => openEditProductModal(row)}
              className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Редагувати товар"
              title="Редагувати товар"
            >
              <Pencil size={14} />
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
      <Pagination
        page={currentPage}
        totalItems={filteredProducts.length}
        pageSize={ADMIN_PRODUCTS_PAGE_SIZE}
        onPageChange={setPage}
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
            <div className="mt-1 w-full h-10 flex items-stretch rounded border border-border bg-bg-input overflow-hidden">
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
                placeholder="Напр. 15 (0 — без знижки)"
                className="flex-1 h-full px-3 text-sm text-text-primary placeholder:text-text-muted bg-transparent border-0 focus:outline-none focus:border-accent"
              />
              <div className="px-3 border-l border-border flex items-center text-sm text-text-muted whitespace-nowrap">
                Після: {discountedPriceForUi !== null ? formatDual(discountedPriceForUi) : '—'}
              </div>
            </div>
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
        open={!!editingImageProductId}
        onClose={() => setEditingImageProductId(null)}
        title="Редагувати зображення товару"
        description="Завантажте зображення з пристрою."
        size="sm"
      >
        <div className="space-y-3">
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
            <p className="text-xs text-text-muted mt-0.5 mb-1">JPEG, PNG або WebP, до {MAX_IMAGES} файлів за раз.</p>
            <div className="mt-1 h-10 w-full rounded border border-border bg-bg-input px-2 flex items-center gap-2">
              <label
                htmlFor="product-image-upload"
                className="inline-flex h-7 items-center rounded border border-border px-2.5 text-xs text-text-primary bg-bg-surface hover:bg-bg-primary cursor-pointer shrink-0"
              >
                Вибрати файли
              </label>
              <span className="text-sm text-text-secondary truncate">
                {selectedFileName || `Файли не вибрано (до ${MAX_IMAGES} фото, можна кілька)`}
              </span>
              <input
                id="product-image-upload"
                type="file"
                accept="image/*"
                multiple
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
