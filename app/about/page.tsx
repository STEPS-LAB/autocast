import type { Metadata } from 'next'
import { motion } from 'framer-motion'
import { Shield, Zap, Award, Users, MapPin, Phone, Mail } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'

export const metadata: Metadata = {
  title: 'Про нас',
  description: 'Дізнайтеся більше про Autocast — преміальний магазин автоелектроніки та запчастин.',
}

const VALUES = [
  {
    icon: Shield,
    title: 'Якість без компромісів',
    desc: 'Ми відбираємо лише перевірених виробників з офіційними сертифікатами та гарантією якості.',
  },
  {
    icon: Zap,
    title: 'Швидкість та зручність',
    desc: 'Моментальний пошук, розумний підбір за VIN та доставка по всій Україні за 1-2 дні.',
  },
  {
    icon: Award,
    title: 'Експертна підтримка',
    desc: 'Наші консультанти допоможуть підібрати товар під ваш автомобіль та бюджет.',
  },
  {
    icon: Users,
    title: 'Довіра клієнтів',
    desc: 'Понад 12 000 задоволених клієнтів обрали нас завдяки прозорим цінам та чесному сервісу.',
  },
]

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="py-20 border-b border-border">
        <div className="container-xl max-w-3xl">
          <p className="text-xs text-accent uppercase tracking-widest font-medium mb-3">Про компанію</p>
          <h1 className="text-display text-text-primary mb-6">
            Ми — Autocast
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Autocast — це команда ентузіастів та авто-фахівців, які з 2019 року постачають преміальну
            автоелектроніку та запчастини для водіїв, що цінують якість.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container-xl">
          <h2 className="text-headline text-text-primary mb-12 text-center">Наші цінності</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 bg-bg-surface border border-border rounded-md">
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
              { value: '2019', label: 'Рік заснування' },
              { value: '500+', label: 'Товарів' },
              { value: '12K+', label: 'Клієнтів' },
              { value: '50+', label: 'Брендів' },
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
