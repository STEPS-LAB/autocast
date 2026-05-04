import type { Metadata } from 'next'
import Image from 'next/image'
import { Shield, Zap, Award, Users } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'

export const metadata: Metadata = {
  title: 'Про нас',
  description:
    'Autocast — сервісний центр і команда експертів з автоелектроніки: діагностика, монтаж, тюнінг та супровід проєкту від ідеї до результату.',
}

const VALUES = [
  {
    icon: Shield,
    title: 'Якість без компромісів',
    desc: 'Стандарти виконання робіт, перевірені матеріали та обладнання й чіткі гарантійні зобов’язання — на сервісі так само, як на монтажі.',
  },
  {
    icon: Zap,
    title: 'Швидкість та зручність',
    desc: 'Запис у зручний час, зрозумілі терміни виконання та оперативна комунікація: від консультації до передачі авто після робіт.',
  },
  {
    icon: Award,
    title: 'Експертна підтримка',
    desc: 'Консультанти та майстри допомагають обрати саме той комплекс послуг і рішень, який відповідає вашому авто, задачам і бюджету.',
  },
  {
    icon: Users,
    title: 'Довіра клієнтів',
    desc: 'Понад 12 000 клієнтів обрали нас за прозорі оцінки робіт, чесні рекомендації та підтримку після візиту до майстерні.',
  },
]

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="bg-white py-20 border-b border-border">
        <div className="container-xl max-w-3xl">
          <h1 className="text-display text-text-primary mb-6">
            Ми — Autocast
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Понад 10 років ми надаємо якісні послуги в автоелектроніці: діагностика, проєктування, монтаж і
            налаштування в нашій майстерні, супровід на всьому шляху — від консультації до готового результату
            на дорозі. Онлайн-каталог і доставка доповнюють сервіс, коли зручніше отримати комплектуючі окремо,
            а в центрі уваги завжди залишаються команда та роботи «під ключ» для вашого авто.
          </p>
          <div className="mt-8 w-full md:w-[70%] mx-auto rounded-lg overflow-hidden border border-border">
            <Image
              src="/images/for-pro-nas.jpg"
              alt="Наша команда та майстерня"
              width={1200}
              height={700}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container-xl">
          <h2 className="text-headline text-text-primary mb-12 text-center">Наші цінності</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 bg-bg-surface border border-border rounded-md shadow-[0_8px_28px_-12px_rgb(15_23_42/0.1)] transition-[translate,transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_20px_44px_-20px_rgb(30_35_41/0.18)]"
              >
                <div className="size-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-bg-surface border-y border-border">
        <div className="container-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2016', label: 'Рік заснування' },
              { value: '500+', label: 'Рішень для авто' },
              { value: '12K+', label: 'Клієнтів' },
              { value: '50+', label: 'Брендів для робіт' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-text-primary mb-1">{value}</p>
                <p className="text-sm text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
