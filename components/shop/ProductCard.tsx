'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore, selectIsWished } from '@/lib/store/wishlist'
import { formatPrice, getDiscountPercent, cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { ProductCard as ProductCardType } from '@/types'
import { applyDiscountToProduct } from '@/lib/discounts'
import { selectDiscountOverrides, useDiscountStore } from '@/lib/store/discounts'

interface ProductCardProps {
  product: ProductCardType
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const overrides = useDiscountStore(selectDiscountOverrides)
  const displayProduct = applyDiscountToProduct(product, overrides)
  const wished = useWishlistStore(selectIsWished(displayProduct.id))
  const toggleWished = useWishlistStore(s => s.toggle)

  const discount =
    displayProduct.sale_price
      ? getDiscountPercent(displayProduct.price, displayProduct.sale_price)
      : null

  const displayPrice = displayProduct.sale_price ?? displayProduct.price
  const displayPriceText = formatPrice(displayPrice)
  const basePriceText = formatPrice(displayProduct.price)

  function renderPriceWithCurrency(priceText: string) {
    const amount = priceText.replace(/\s*₴$/, '')
    return (
      <>
        <span className="font-sans tabular-nums">{amount}</span>
        <span className="font-sans"> ₴</span>
      </>
    )
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem(displayProduct)
  }

  return (
    <motion.article
      whileHover={displayProduct.stock > 0 ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/product/${displayProduct.slug}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/product/${displayProduct.slug}`)
        }
      }}
      className={cn(
        'group relative bg-bg-surface border border-border rounded-[10px] overflow-hidden flex flex-col cursor-pointer',
        'shadow-[0_10px_22px_rgba(0,0,0,0.10)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.16)] transition-shadow',
        displayProduct.stock === 0 && 'opacity-60 saturate-0'
      )}
    >
      {/* Image */}
      <Link
        href={`/product/${displayProduct.slug}`}
        onClick={displayProduct.stock === 0 ? (e) => e.preventDefault() : undefined}
        className={cn(
          'relative block aspect-square overflow-hidden bg-bg-elevated',
          displayProduct.stock === 0 && 'pointer-events-none'
        )}
      >
        {displayProduct.images[0] && !imgError ? (
          <Image
            src={displayProduct.images[0]}
            alt={displayProduct.name_ua}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="size-full flex items-center justify-center text-text-muted">
            <ShoppingCart size={32} strokeWidth={1} />
          </div>
        )}

        {displayProduct.stock === 0 && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="px-3 py-1 rounded border border-white/20 bg-black/40 text-white text-xs sm:text-sm font-semibold tracking-wide uppercase">
              Немає в наявності
            </span>
          </div>
        )}

        {discount && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge variant="error" className="text-xs">
              -{discount}%
            </Badge>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            toggleWished(displayProduct)
          }}
          className={cn(
            'absolute top-2 right-2 size-7 rounded-full flex items-center justify-center',
            'border border-border bg-bg-primary/60 backdrop-blur-sm',
            'opacity-100 transition-all',
            'hover:bg-bg-primary/80 hover:border-border-light hover:scale-105',
            wished && 'opacity-100'
          )}
          aria-label="В обране"
        >
          <Heart
            size={13}
            className={cn(
              'transition-colors',
              wished ? 'fill-accent text-accent' : 'text-text-muted group-hover:text-accent'
            )}
          />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {displayProduct.brand && (
          <span className="text-xs text-text-muted">{displayProduct.brand.name}</span>
        )}

        <Link
          href={`/product/${displayProduct.slug}`}
          onClick={displayProduct.stock === 0 ? (e) => e.preventDefault() : undefined}
          className={cn(
            'text-sm font-medium text-text-primary line-clamp-2 leading-snug',
            displayProduct.stock > 0 && 'hover:text-accent transition-colors',
            displayProduct.stock === 0 && 'pointer-events-none'
          )}
        >
          {displayProduct.name_ua}
        </Link>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-text-primary">
            {renderPriceWithCurrency(displayPriceText)}
          </span>
          {displayProduct.sale_price && (
            <span className="text-xs text-text-muted line-through">
              {renderPriceWithCurrency(basePriceText)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={displayProduct.stock === 0}
          className={cn(
            'flex items-center justify-center gap-2 h-9 rounded-[10px] text-sm font-medium',
            'transition-all duration-150 active:scale-[0.98]',
            displayProduct.stock > 0
              ? 'bg-accent/10 text-black border border-accent/20 hover:bg-accent hover:text-black'
              : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border'
          )}
        >
          <ShoppingCart size={14} />
          {displayProduct.stock > 0 ? 'В кошик' : 'Немає в наявності'}
        </button>
      </div>
    </motion.article>
  )
}
