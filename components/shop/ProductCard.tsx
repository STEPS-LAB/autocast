'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, Eye, Heart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice, getDiscountPercent, cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { ProductCard as ProductCardType } from '@/types'

interface ProductCardProps {
  product: ProductCardType
  onQuickView?: (product: ProductCardType) => void
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [wished, setWished] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  const discount =
    product.sale_price
      ? getDiscountPercent(product.price, product.sale_price)
      : null

  const displayPrice = product.sale_price ?? product.price

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product)
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-bg-surface border border-border rounded-md overflow-hidden flex flex-col"
    >
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-bg-elevated">
        {product.images[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name_ua}
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

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <Badge variant="accent" className="text-xs">
              -{discount}%
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="error" className="text-xs">
              Немає
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); setWished(v => !v) }}
          className={cn(
            'absolute top-2 right-2 size-7 rounded-full flex items-center justify-center',
            'border border-border bg-bg-primary/60 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-all',
            wished && 'opacity-100'
          )}
          aria-label="В обране"
        >
          <Heart
            size={13}
            className={wished ? 'fill-accent text-accent' : 'text-text-muted'}
          />
        </button>

        {/* Quick view */}
        {onQuickView && (
          <button
            onClick={e => { e.preventDefault(); onQuickView(product) }}
            className={cn(
              'absolute inset-x-0 bottom-0 py-2 flex items-center justify-center gap-1.5',
              'bg-bg-primary/80 backdrop-blur-sm text-text-primary text-xs font-medium',
              'opacity-0 group-hover:opacity-100 transition-all translate-y-full group-hover:translate-y-0',
              'border-t border-border'
            )}
          >
            <Eye size={13} />
            Швидкий перегляд
          </button>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {product.brand && (
          <span className="text-xs text-text-muted">{product.brand.name}</span>
        )}

        <Link
          href={`/product/${product.slug}`}
          className="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-2 leading-snug"
        >
          {product.name_ua}
        </Link>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-text-primary price">
            {formatPrice(displayPrice)}
          </span>
          {product.sale_price && (
            <span className="text-xs text-text-muted line-through price">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={cn(
            'flex items-center justify-center gap-2 h-9 rounded text-sm font-medium',
            'transition-all duration-150 active:scale-[0.98]',
            product.stock > 0
              ? 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white'
              : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border'
          )}
        >
          <ShoppingCart size={14} />
          {product.stock > 0 ? 'В кошик' : 'Немає в наявності'}
        </button>
      </div>
    </motion.article>
  )
}
