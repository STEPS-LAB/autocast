import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { BRANDS, CATEGORIES, getProductCards, getProductBySlug, PRODUCTS } from '@/lib/data/seed'
import type { Brand, CarMake, CarModel, Category, Product, ProductCard } from '@/types'
import { CAR_MAKES, CAR_MODELS } from '@/lib/data/seed'

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
  is_featured: boolean
  created_at: string
  category?: DbCategoryRow | DbCategoryRow[]
  brand?: DbBrandRow | DbBrandRow[]
}

interface DbCarMakeRow {
  id: string
  name: string
}

interface DbCarModelRow {
  id: string
  make_id: string
  name: string
}

function allowSeedFallback(): boolean {
  return process.env['CATALOG_STRICT_DB'] !== 'true'
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

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .order('sort_order', { ascending: true })

    if (error || !data) return allowSeedFallback() ? CATEGORIES : []
    if (data.length === 0) return allowSeedFallback() ? CATEGORIES : []
    return (data as DbCategoryRow[]).map(rowToCategory)
  } catch {
    return allowSeedFallback() ? CATEGORIES : []
  }
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('brands')
      .select('id,name,logo_url')
      .order('name', { ascending: true })

    if (error || !data) return allowSeedFallback() ? BRANDS : []
    if (data.length === 0) return allowSeedFallback() ? BRANDS : []
    return (data as DbBrandRow[]).map(rowToBrand)
  } catch {
    return allowSeedFallback() ? BRANDS : []
  }
}

export async function getProductCardsFromDb(): Promise<ProductCard[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,slug,name_ua,price,sale_price,stock,images,category_id,brand_id,created_at,is_featured,description_ua,specs,
        category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
        brand:brands(id,name,logo_url)
      `)
      .order('created_at', { ascending: false })

    if (error || !data) return allowSeedFallback() ? getProductCards() : []
    if (data.length === 0) return allowSeedFallback() ? getProductCards() : []
    return (data as DbProductRow[]).map(rowToProductCard)
  } catch {
    return allowSeedFallback() ? getProductCards() : []
  }
}

export async function getProductsFromDb(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
        category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
        brand:brands(id,name,logo_url)
      `)
      .order('created_at', { ascending: false })

    if (error || !data) return allowSeedFallback() ? PRODUCTS : []
    if (data.length === 0) return allowSeedFallback() ? PRODUCTS : []
    return (data as DbProductRow[]).map(rowToProduct)
  } catch {
    return allowSeedFallback() ? PRODUCTS : []
  }
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
        category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
        brand:brands(id,name,logo_url)
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error || !data) return allowSeedFallback() ? getProductBySlug(slug) : undefined
    return rowToProduct(data as DbProductRow)
  } catch {
    return allowSeedFallback() ? getProductBySlug(slug) : undefined
  }
}

export async function getCarMakes(): Promise<CarMake[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('car_makes')
      .select('id,name')
      .order('name', { ascending: true })

    if (error || !data) return allowSeedFallback() ? CAR_MAKES : []
    if (data.length === 0) return allowSeedFallback() ? CAR_MAKES : []
    return (data as DbCarMakeRow[]).map((row) => ({ id: row.id, name: row.name }))
  } catch {
    return allowSeedFallback() ? CAR_MAKES : []
  }
}

export async function getCarModelsByMake(): Promise<Record<string, string[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('car_models')
      .select('id,make_id,name')
      .order('name', { ascending: true })

    if (error || !data) return allowSeedFallback() ? CAR_MODELS : {}
    if (data.length === 0) return allowSeedFallback() ? CAR_MODELS : {}
    return (data as DbCarModelRow[]).reduce<Record<string, string[]>>((acc, row) => {
      const bucket = acc[row.make_id] ?? []
      bucket.push(row.name)
      acc[row.make_id] = bucket
      return acc
    }, {})
  } catch {
    return allowSeedFallback() ? CAR_MODELS : {}
  }
}
