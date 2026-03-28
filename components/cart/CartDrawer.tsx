'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore, selectCartTotal, selectCartCount } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { formatPrice, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import DocumentBodyPortal, { DRAWER_BACKDROP_Z, DRAWER_PANEL_Z } from '@/components/layout/DocumentBodyPortal'

function unlockBodyScrollIfNoDrawer() {
  const cartOpen = useCartStore.getState().isOpen
  const wishOpen = useWishlistStore.getState().isOpen
  if (!cartOpen && !wishOpen) {
    document.body.style.overflow = ''
  }
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore()
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
  }, [isOpen])

  useEffect(() => () => {
    unlockBodyScrollIfNoDrawer()
  }, [])

  /** Відкриття: панель з’їжджає зправа (ease-out). Закриття: той самий шлях у зворотному часі (ease-in). */
  const slideDuration = 0.32
  const slideEaseOpen: [number, number, number, number] = [0.32, 0.72, 0, 1]
  const slideEaseClose: [number, number, number, number] = [1, 0, 0.68, 0.28]

  return (
    <DocumentBodyPortal>
      {/* Окремий AnimatePresence на шар: масив із двох motion на iOS/WebKit часто не відпрацьовує exit */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: slideDuration,
                ease: slideEaseClose,
              },
            }}
            transition={{
              duration: slideDuration * 0.85,
              ease: slideEaseOpen,
            }}
            className={cn(
              'fm-drawer-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm',
              DRAWER_BACKDROP_Z
            )}
            onClick={closeCart}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence onExitComplete={unlockBodyScrollIfNoDrawer}>
        {isOpen ? (
          <motion.div
            key="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{
              x: '100%',
              transition: {
                type: 'tween',
                duration: slideDuration,
                ease: slideEaseClose,
              },
            }}
            transition={{
              type: 'tween',
              duration: slideDuration,
              ease: slideEaseOpen,
            }}
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
            className={cn(
              'fm-drawer-panel fixed right-0 top-0 bottom-0 w-full max-w-sm min-w-0 bg-bg-surface border-l border-border flex flex-col overflow-hidden touch-pan-y',
              DRAWER_PANEL_Z
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-accent" />
                <h2 className="font-semibold text-text-primary">
                  Кошик
                  {count > 0 && (
                    <span className="ml-2 text-sm font-normal text-text-muted">
                      ({count})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Закрити"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="size-16 rounded-full bg-bg-elevated flex items-center justify-center">
                    <ShoppingBag size={28} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Кошик порожній</p>
                    <p className="text-sm text-text-muted mt-1">
                      Додайте товари для оформлення замовлення
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={closeCart}
                    className="mt-2"
                  >
                    <Link href="/shop">Перейти в магазин</Link>
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.18 }}
                        className="flex gap-3"
                      >
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="relative size-16 rounded bg-bg-elevated shrink-0 overflow-hidden border border-border"
                        >
                          {item.product.images[0] && (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name_ua}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-sm text-text-primary hover:text-accent transition-colors line-clamp-2 leading-snug"
                          >
                            {item.product.name_ua}
                          </Link>
                          <p className="text-sm font-semibold text-accent price mt-1">
                            {formatPrice(
                              (item.product.sale_price ?? item.product.price) * item.quantity
                            )}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={cn(
                                'size-6 flex items-center justify-center rounded border border-border',
                                'text-text-secondary hover:text-text-primary hover:border-border-light',
                                'transition-colors text-xs'
                              )}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium text-text-primary w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className={cn(
                                'size-6 flex items-center justify-center rounded border border-border',
                                'text-text-secondary hover:text-text-primary hover:border-border-light',
                                'transition-colors text-xs'
                              )}
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
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

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Разом</span>
                  <span className="text-lg font-bold text-text-primary price">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link href="/checkout" onClick={closeCart}>
                  <Button fullWidth size="lg">
                    Оформити замовлення
                  </Button>
                </Link>
                <Link href="/cart" onClick={closeCart}>
                  <Button variant="ghost" fullWidth size="sm">
                    Переглянути кошик
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DocumentBodyPortal>
  )
}
