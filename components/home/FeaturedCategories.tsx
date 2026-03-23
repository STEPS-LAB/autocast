'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES } from '@/lib/data/seed'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function FeaturedCategories() {
  return (
    <section className="py-20">
      <div className="container-xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs text-accent uppercase tracking-widest font-medium mb-2">
              Каталог
            </p>
            <h2 className="text-headline text-text-primary">Категорії товарів</h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Всі категорії <ArrowRight size={14} />
          </Link>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {CATEGORIES.map(cat => (
            <motion.div key={cat.id} variants={item}>
              <Link href={`/shop/${cat.slug}`} className="group block">
                <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-bg-surface border border-border mb-3">
                  {cat.image_url && (
                    <Image
                      src={cat.image_url}
                      alt={cat.name_ua}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <span className="text-xs text-text-muted">Переглянути</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex items-center justify-between px-0.5">
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {cat.name_ua}
                  </h3>
                  <ArrowRight
                    size={14}
                    className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
