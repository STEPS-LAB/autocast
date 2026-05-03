'use client'

import { motion } from 'framer-motion'
import { UserRound } from 'lucide-react'

const REVIEWS = [
  {
    id: 'review-1',
    text:
      'Встановлював парктроніки перед/зад на Honda. Зробили швидко і якісно. Зручно, що це магазин + майстерня, коли під\'їхав забрати, один задній парктронік не коректно почав працювати і хлопці швидко спробували інший, а потім замінили блок.',
    author: 'ROMA DOV',
  },
  {
    id: 'review-2',
    text:
      'Молодці! Дякую! Задоволений! Раджу! Професійно, швидко, якісно провели ремонт фар ML 350. Окремо сподобалась консультація перед роботою — пояснили варіанти й допомогли обрати оптимальне рішення.',
    author: 'ANDRII SURIKOV',
  },
  {
    id: 'review-3',
    text:
      'Професійний персонал, індивідуальний підхід до кожного клієнта, гарний вибір якісних аксесуарів, звук, реєстратори, камери, світло та інше. Дуже вдячний за пораду під час останнього візиту щодо встановлення ксенону.',
    author: 'VICTOR ANATOLIYEVICH',
  },
]

export default function HomeReviews() {
  return (
    <section className="py-16 bg-bg-surface border-y border-graphite/12">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2 className="text-headline text-text-primary mb-3">Що кажуть наші клієнти</h2>
          <p className="text-text-secondary">
            Ставайте нашим клієнтом та отримуйте висококваліфіковану допомогу вже зараз!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
          {REVIEWS.map((review, index) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="h-full rounded-md border border-graphite/15 bg-bg-surface p-5 flex flex-col micro-lift shadow-[0_12px_40px_-16px_rgb(30_35_41/0.2)]"
            >
              <p className="text-sm text-text-secondary leading-relaxed flex-1">{review.text}</p>
              <div className="pt-5 mt-5 border-t border-graphite/10">
                <div className="inline-flex items-center gap-2.5">
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-graphite/15 bg-graphite/8 text-graphite">
                    <UserRound size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{review.author}</p>
                    <p className="text-xs text-amber-500 tracking-wide">★★★★★</p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
