'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import { getFeaturedProducts } from '@/lib/data/seed'

export default function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 8)

  return (
    <section className="py-20 bg-bg-surface">
      <div className="container-xl">
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
            className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
          >
            Переглянути весь каталог <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
