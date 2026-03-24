'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3 } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import { getFeaturedProducts } from '@/lib/data/seed'
import { formatPrice } from '@/lib/utils'

export default function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 8)
  const offerProducts = products.slice(0, 4)

  return (
    <section className="py-20 bg-bg-surface">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 rounded-md border border-border bg-bg-primary p-4 md:p-5"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-accent uppercase tracking-widest font-medium mb-1">
                Найкращі пропозиції
              </p>
              <h3 className="text-xl font-semibold text-text-primary">Знижки від 10% до 25%</h3>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 rounded border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent">
              <Clock3 size={14} />
              Лише сьогодні
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {offerProducts.map(product => (
              <Link
                key={`offer-${product.id}`}
                href={`/product/${product.slug}`}
                className="group rounded border border-border bg-bg-surface p-2.5 micro-lift"
              >
                <div className="relative aspect-[16/10] rounded overflow-hidden mb-2">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.name_ua}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
                    Хіт
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2 mb-1">{product.name_ua}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary font-sans tabular-nums">
                    {formatPrice(product.sale_price ?? product.price)}
                  </span>
                  {product.sale_price && (
                    <span className="text-[11px] text-text-muted line-through font-sans tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs text-accent uppercase tracking-widest font-medium mb-2">
              Вибір редакції
            </p>
            <h2 className="text-headline text-text-primary">Популярні товари</h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Всі товари <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors micro-pop"
          >
            Переглянути весь каталог <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
