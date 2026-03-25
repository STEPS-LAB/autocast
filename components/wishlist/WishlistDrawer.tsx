'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react'
import { useWishlistStore, selectWishlistCount } from '@/lib/store/wishlist'
import { useCartStore } from '@/lib/store/cart'
import { cn, formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function WishlistDrawer() {
  const { items, isOpen, close, remove, clear } = useWishlistStore()
  const count = useWishlistStore(selectWishlistCount)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed right-0 inset-y-0 z-[60] w-full max-w-sm bg-bg-surface border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-accent" />
                <h2 className="font-semibold text-text-primary">
                  Вішліст
                  {count > 0 && (
                    <span className="ml-2 text-sm font-normal text-text-muted">({count})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Закрити"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="size-16 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Heart size={28} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Поки що порожньо</p>
                    <p className="text-sm text-text-muted mt-1">
                      Натискайте сердечко на картці товару, щоб зберегти його
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={close} className="mt-2">
                    <Link href="/shop">Перейти в магазин</Link>
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {items.map(product => (
                      <motion.li
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={close}
                          className="relative size-16 rounded bg-bg-elevated shrink-0 overflow-hidden border border-border"
                        >
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name_ua}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          {product.brand?.name && (
                            <p className="text-xs text-text-muted">{product.brand.name}</p>
                          )}
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={close}
                            className="text-sm text-text-primary hover:text-accent transition-colors line-clamp-2 leading-snug"
                          >
                            {product.name_ua}
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-accent price">
                              {formatPrice(product.sale_price ?? product.price)}
                            </span>
                            {product.sale_price && (
                              <span className="text-xs text-text-muted line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => addItem(product)}
                              className={cn(
                                'h-8 px-2.5 rounded border border-border flex items-center gap-1.5',
                                'text-text-secondary hover:text-text-primary hover:border-border-light transition-colors'
                              )}
                              aria-label="Додати в кошик"
                            >
                              <ShoppingCart size={14} />
                              <span className="text-xs font-medium">В кошик</span>
                            </button>
                            <button
                              onClick={() => remove(product.id)}
                              className="ml-auto p-1 text-text-muted hover:text-error transition-colors rounded"
                              aria-label="Видалити"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clear} className="border border-border">
                  Очистити
                </Button>
                <Link href="/shop" onClick={close} className="flex-1">
                  <Button fullWidth size="sm" variant="secondary">
                    Продовжити покупки
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

