'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const NEWS = [
  {
    id: 'news-1',
    title: 'Як обрати автомагнітолу у 2026: 5 практичних порад',
    excerpt: 'Розбираємо ключові параметри: екран, потужність, CarPlay/Android Auto і сумісність.',
    href: '/news',
    image:
      'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'news-2',
    title: 'LED-освітлення для авто: які лампи реально працюють',
    excerpt: 'Порівняння популярних типів цоколів і поради для безпечного нічного водіння.',
    href: '/news',
    image:
      'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'news-3',
    title: 'Захист від угону: базовий комплект, який варто встановити',
    excerpt: 'Сигналізація, трекер і іммобілайзер: як зібрати комплект під ваш бюджет.',
    href: '/news',
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80',
  },
]

export default function HomeNews() {
  return (
    <section className="py-20">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs text-accent uppercase tracking-widest font-medium mb-2">Наші новини</p>
            <h2 className="text-headline text-text-primary">Корисні матеріали для водіїв</h2>
          </div>
          <Link
            href="/news"
            className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Всі новини <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {NEWS.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group rounded-md border border-border overflow-hidden bg-bg-surface micro-lift"
            >
              <Link href={item.href} className="block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-text-primary mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">{item.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                    Читати <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
