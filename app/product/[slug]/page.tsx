import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cookies } from 'next/headers'
import ProductGallery from '@/components/product/ProductGallery'
import ProductSpecs from '@/components/product/ProductSpecs'
import ProductDetailPanel from '@/components/product/ProductDetailPanel'
import AddToCart from '@/components/product/AddToCart'
import RelatedProducts from '@/components/product/RelatedProducts'
import PageTransition from '@/components/layout/PageTransition'
import { getDiscountPercent } from '@/lib/utils'
import RecentlyViewedTracker from '@/components/product/RecentlyViewedTracker'
import { applyDiscountToProduct, DISCOUNTS_COOKIE_KEY, parseDiscountOverrides } from '@/lib/discounts'
import { getProductBySlugFromDb, getProductCardsFromDb } from '@/lib/data/catalog-db'
import { createClient } from '@/lib/supabase/server'
import ProductTabs from '@/components/product/ProductTabs'
import ProductReviews, { type ProductReview } from '@/components/product/ProductReviews'
import ProductVideos from '@/components/product/ProductVideos'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugFromDb(slug)
  if (!product) return { title: 'Товар не знайдено' }
  return {
    title: product.name_ua,
    description: product.description_ua.slice(0, 160),
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: Props) {
  const cookieStore = await cookies()
  const discountOverrides = parseDiscountOverrides(cookieStore.get(DISCOUNTS_COOKIE_KEY)?.value)
  const { slug } = await params
  const sourceProduct = await getProductBySlugFromDb(slug)
  if (!sourceProduct) notFound()
  const product = applyDiscountToProduct(sourceProduct, discountOverrides)
  const videoUrls = product.video_urls ?? []

  const category = product.category
  const brand = product.brand
  const allCards = (await getProductCardsFromDb()).map(card => applyDiscountToProduct(card, discountOverrides))

  const related = allCards
    .filter(p => p.id !== product.id && p.category?.slug === category?.slug)
    .slice(0, 4)

  const discount = product.sale_price
    ? getDiscountPercent(product.price, product.sale_price)
    : null

  const displayPrice = product.sale_price ?? product.price

  const productCard = {
    id: product.id,
    slug: product.slug,
    name_ua: product.name_ua,
    price: product.price,
    sale_price: product.sale_price,
    images: product.images,
    stock: product.stock,
    category: category ? { name_ua: category.name_ua, slug: category.slug } : undefined,
    brand: brand ? { name: brand.name } : undefined,
  }

  const supabase = await createClient()
  const { data: reviewsData } = await supabase
    .from('product_reviews')
    .select('id,user_id,body,created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewsData as ProductReview[] | null) ?? []

  return (
    <PageTransition>
      <div className="container-xl py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-8">
          <Link href="/" className="hover:text-text-primary transition-colors">Головна</Link>
          <ChevronRight size={12} />
          <Link href="/shop" className="hover:text-text-primary transition-colors">Магазин</Link>
          {category && (
            <>
              <ChevronRight size={12} />
              <Link
                href={`/shop?category=${category.slug}`}
                className="hover:text-text-primary transition-colors"
              >
                {category.name_ua}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-text-secondary truncate max-w-[200px]">{product.name_ua}</span>
        </nav>

        {/* Product layout */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images} name={product.name_ua} />
          </div>

          <ProductDetailPanel
            nameUa={product.name_ua}
            displayPrice={displayPrice}
            basePrice={product.price}
            hasSale={!!product.sale_price}
            stock={product.stock}
            brandName={brand?.name}
            categoryName={category?.name_ua}
            discountPercent={discount}
            productCard={productCard}
          />
        </div>

        <ProductTabs
          description={
            <div className="rounded-lg border border-border bg-bg-surface p-6 shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {product.description_ua}
              </p>
            </div>
          }
          specs={<ProductSpecs specs={product.specs} />}
          reviews={<ProductReviews productId={product.id} initialReviews={reviews} />}
          videos={<ProductVideos urls={videoUrls} />}
          reviewsCount={reviews.length}
          videosCount={videoUrls.length}
          defaultTab="specs"
        />

        {/* Related */}
        {related.length > 0 && (
          <RelatedProducts products={related} />
        )}
      </div>

      {/* Recently viewed tracker */}
      <RecentlyViewedTracker product={productCard} />

      {/* Mobile sticky AddToCart */}
      <div className="md:hidden">
        <AddToCart product={productCard} sticky />
      </div>
    </PageTransition>
  )
}
