import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { unstable_cache } from 'next/cache'
import type { Brand, Category, Product, ProductCard } from '@/types'

interface DbCategoryRow {
  id: string
  slug: string
  name_ua: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
}

interface DbBrandRow {
  id: string
  name: string
  logo_url: string | null
}

interface DbProductRow {
  id: string
  slug: string
  name_ua: string
  description_ua: string
  price: number
  sale_price: number | null
  stock: number
  category_id: string
  brand_id: string | null
  specs: Record<string, string>
  images: string[]
  video_urls?: string[]
  is_featured: boolean
  created_at: string
  category?: DbCategoryRow | DbCategoryRow[]
  brand?: DbBrandRow | DbBrandRow[]
}

interface CatalogReadOptions {
  dbOnly?: boolean
}

function rowToCategory(row: DbCategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    parent_id: row.parent_id,
    image_url: row.image_url,
    sort_order: row.sort_order,
  }
}

function rowToBrand(row: DbBrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    logo_url: row.logo_url,
  }
}

function unwrapRelation<T>(value?: T | T[]): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

function rowToProduct(row: DbProductRow): Product {
  const category = unwrapRelation(row.category)
  const brand = unwrapRelation(row.brand)
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    description_ua: row.description_ua,
    price: Number(row.price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    stock: row.stock,
    category_id: row.category_id,
    brand_id: row.brand_id,
    specs: row.specs ?? {},
    images: row.images ?? [],
    video_urls: row.video_urls ?? [],
    is_featured: row.is_featured,
    created_at: row.created_at,
    category: category ? rowToCategory(category) : undefined,
    brand: brand ? rowToBrand(brand) : undefined,
  }
}

function rowToProductCard(row: DbProductRow): ProductCard {
  const category = unwrapRelation(row.category)
  const brand = unwrapRelation(row.brand)
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    price: Number(row.price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    images: row.images ?? [],
    stock: row.stock,
    category: category
      ? { name_ua: category.name_ua, slug: category.slug }
      : undefined,
    brand: brand ? { name: brand.name } : undefined,
  }
}

async function fetchCategories(_dbOnly: boolean): Promise<Category[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) return []
    return (data as DbCategoryRow[]).map(rowToCategory)
  } catch {
    return []
  }
}

const getCategoriesCached = unstable_cache(
  () => fetchCategories(false),
  ['catalog-categories', 'db-only'],
  { revalidate: 120 }
)

const getCategoriesDbOnlyCached = unstable_cache(
  () => fetchCategories(true),
  ['catalog-categories-dbonly', 'db-only'],
  { revalidate: 120 }
)

export async function getCategories(options?: CatalogReadOptions): Promise<Category[]> {
  return options?.dbOnly ? getCategoriesDbOnlyCached() : getCategoriesCached()
}

async function fetchBrands(_dbOnly: boolean): Promise<Brand[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('brands')
      .select('id,name,logo_url')
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) return []
    return (data as DbBrandRow[]).map(rowToBrand)
  } catch {
    return []
  }
}

const getBrandsCached = unstable_cache(
  () => fetchBrands(false),
  ['catalog-brands', 'db-only'],
  { revalidate: 120 }
)

export async function getBrands(options?: CatalogReadOptions): Promise<Brand[]> {
  return options?.dbOnly ? fetchBrands(true) : getBrandsCached()
}

async function fetchProductCards(_dbOnly: boolean): Promise<ProductCard[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,slug,name_ua,price,sale_price,stock,images,category_id,brand_id,created_at,is_featured,description_ua,specs,
        category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
        brand:brands(id,name,logo_url)
      `)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return []
    return (data as DbProductRow[]).map(rowToProductCard)
  } catch {
    return []
  }
}

const getProductCardsCached = unstable_cache(
  () => fetchProductCards(false),
  ['catalog-product-cards', 'db-only'],
  { revalidate: 60 }
)

export async function getProductCardsFromDb(options?: CatalogReadOptions): Promise<ProductCard[]> {
  return options?.dbOnly ? fetchProductCards(true) : getProductCardsCached()
}

export async function getProductsFromDb(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const baseSelect = `
      id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
      category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
      brand:brands(id,name,logo_url)
    `
    const { data, error } = await supabase
      .from('products')
      .select(`video_urls,${baseSelect}`)
      .order('created_at', { ascending: false })

    if (error) {
      const msg = String((error as any).message ?? error)
      if (msg.includes('video_urls')) {
        const retry = await supabase
          .from('products')
          .select(baseSelect)
          .order('created_at', { ascending: false })
        if (retry.error || !retry.data || retry.data.length === 0) return []
        return (retry.data as DbProductRow[]).map(rowToProduct)
      }
      return []
    }
    if (!data || data.length === 0) return []
    return (data as DbProductRow[]).map(rowToProduct)
  } catch {
    return []
  }
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  try {
    const supabase = await createClient()
    const baseSelect = `
      id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
      category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
      brand:brands(id,name,logo_url)
    `
    const { data, error } = await supabase
      .from('products')
      .select(`video_urls,${baseSelect}`)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      const msg = String((error as any).message ?? error)
      if (msg.includes('video_urls')) {
        const retry = await supabase
          .from('products')
          .select(baseSelect)
          .eq('slug', slug)
          .maybeSingle()
        if (retry.error || !retry.data) return undefined
        return rowToProduct(retry.data as DbProductRow)
      }
      return undefined
    }
    if (!data) return undefined
    return rowToProduct(data as DbProductRow)
  } catch {
    return undefined
  }
}

