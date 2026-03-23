import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Package, Truck, ShieldCheck } from 'lucide-react'
import { PRODUCTS, getProductCards, CATEGORIES, BRANDS } from '@/lib/data/seed'
import ProductGallery from '@/components/product/ProductGallery'
import ProductSpecs from '@/components/product/ProductSpecs'
import AddToCart from '@/components/product/AddToCart'
import RelatedProducts from '@/components/product/RelatedProducts'
import Badge from '@/components/ui/Badge'
import PageTransition from '@/components/layout/PageTransition'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import RecentlyViewedTracker from '@/components/product/RecentlyViewedTracker'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product) return { title: 'Товар не знайдено' }
  return {
    title: product.name_ua,
    description: product.description_ua.slice(0, 160),
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

const GUARANTEES = [
  { icon: Package, label: 'Офіційна гарантія', desc: '12 місяців' },
  { icon: Truck, label: 'Доставка', desc: 'Нова Пошта, 1-2 дні' },
  { icon: ShieldCheck, label: 'Повернення', desc: '14 днів' },
]

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = PRODUCTS.find(p => p.slug === slug)
  if (!product) notFound()

  const category = CATEGORIES.find(c => c.id === product.category_id)
  const brand = BRANDS.find(b => b.id === product.brand_id)
  const allCards = getProductCards()

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

          {/* Details */}
          <div className="flex flex-col gap-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {brand && (
                <Badge variant="default">{brand.name}</Badge>
              )}
              {category && (
                <Badge variant="muted">{category.name_ua}</Badge>
              )}
              {discount && (
                <Badge variant="accent">-{discount}%</Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">
              {product.name_ua}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-text-primary price">
                {formatPrice(displayPrice)}
              </span>
              {product.sale_price && (
                <span className="text-lg text-text-muted line-through price">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${product.stock > 0 ? 'bg-success' : 'bg-error'}`}
              />
              <span className={`text-sm ${product.stock > 0 ? 'text-success' : 'text-error'}`}>
                {product.stock > 0
                  ? `В наявності (${product.stock} шт.)`
                  : 'Немає в наявності'}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-text-secondary leading-relaxed">
              {product.description_ua}
            </p>

            {/* Add to cart */}
            <AddToCart product={productCard} />

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              {GUARANTEES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon size={18} className="text-accent" />
                  <p className="text-xs font-medium text-text-primary">{label}</p>
                  <p className="text-[11px] text-text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specs + Description tabs */}
        <div className="grid lg:grid-cols-3 gap-10 mb-16">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Про товар
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {product.description_ua}
              </p>
            </div>
            <ProductSpecs specs={product.specs} />
          </div>
        </div>

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
