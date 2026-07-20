import { createServiceClient } from '@/lib/supabase/server'
import type { Brand, Category } from '@/types'
import ProductForm, { type ProductDraft } from './ProductForm'

const PRODUCT_SELECT_WITH_VIDEO =
  'id,name_ua,description_ua,price,stock,category_id,brand_id,specs,images,video_urls,is_featured'
const PRODUCT_SELECT_WITHOUT_VIDEO =
  'id,name_ua,description_ua,price,stock,category_id,brand_id,specs,images,is_featured'

async function loadProductFormData(editProductId: string | null) {
  const supabase = createServiceClient()

  const [categoriesResult, brandsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .order('sort_order', { ascending: true }),
    supabase.from('brands').select('id,name,logo_url').order('name', { ascending: true }),
  ])

  if (categoriesResult.error) {
    return {
      categories: [] as Category[],
      brands: [] as Brand[],
      product: null as ProductDraft | null,
      loadError: categoriesResult.error.message,
    }
  }
  if (brandsResult.error) {
    return {
      categories: (categoriesResult.data ?? []) as Category[],
      brands: [] as Brand[],
      product: null as ProductDraft | null,
      loadError: brandsResult.error.message,
    }
  }

  const categories = (categoriesResult.data ?? []) as Category[]
  const brands = (brandsResult.data ?? []) as Brand[]

  if (!editProductId) {
    return { categories, brands, product: null, loadError: null as string | null }
  }

  const first = await supabase
    .from('products')
    .select(PRODUCT_SELECT_WITH_VIDEO)
    .eq('id', editProductId)
    .maybeSingle()

  if (first.error && String(first.error.message).includes('video_urls')) {
    const retry = await supabase
      .from('products')
      .select(PRODUCT_SELECT_WITHOUT_VIDEO)
      .eq('id', editProductId)
      .maybeSingle()
    if (retry.error) {
      return { categories, brands, product: null, loadError: retry.error.message }
    }
    if (!retry.data) {
      return { categories, brands, product: null, loadError: 'Товар не знайдено.' }
    }
    return {
      categories,
      brands,
      product: { ...(retry.data as Omit<ProductDraft, 'video_urls'>), video_urls: [] },
      loadError: null,
    }
  }

  if (first.error) {
    return { categories, brands, product: null, loadError: first.error.message }
  }
  if (!first.data) {
    return { categories, brands, product: null, loadError: 'Товар не знайдено.' }
  }

  return {
    categories,
    brands,
    product: first.data as ProductDraft,
    loadError: null as string | null,
  }
}

export default async function AdminNewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>
}) {
  const sp = await searchParams
  const rawEdit = sp.edit
  const editProductId = Array.isArray(rawEdit) ? rawEdit[0] ?? null : rawEdit?.trim() || null

  const { categories, brands, product, loadError } = await loadProductFormData(editProductId)

  return (
    <ProductForm
      key={editProductId ?? 'new'}
      editProductId={editProductId}
      initialCategories={categories}
      initialBrands={brands}
      initialProduct={product}
      loadError={loadError}
    />
  )
}
