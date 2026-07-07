import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import HeroConsultationLink from '@/components/home/HeroConsultationLink'
import { buttonLinkClasses } from '@/components/ui/buttonStyles'
import {
  imageAltHero,
  imageTitleHero,
  linkTitleHeroServices,
  linkTitleHeroShop,
} from '@/lib/seo/accessibility'

const STATS = [
  { label: 'Товарів в каталозі', value: '500+' },
  { label: 'Задоволених клієнтів', value: '12K+' },
  { label: 'Брендів-партнерів', value: '50+' },
] as const

const HERO_SLIDE = {
  description:
    'Професійні послуги з автозвуку та електроніки — з якісними товарами під ключ.',
  cta: 'Переглянути послуги',
  href: '/services',
  image: '/images/hero.webp',
} as const

const heroOverlayBg = [
  'radial-gradient(ellipse 70% 54% at 34% 36%, rgb(255 193 7 / 0.11), transparent 54%)',
  'radial-gradient(ellipse 118% 108% at 6% 52%, rgb(30 35 41 / 0.6) 0%, rgb(30 35 41 / 0.32) 40%, rgb(30 35 41 / 0.08) 56%, transparent 72%)',
  'radial-gradient(ellipse 95% 100% at 96% 28%, rgb(30 35 41 / 0.26) 0%, rgb(30 35 41 / 0.06) 45%, transparent 62%)',
  'linear-gradient(to bottom, rgb(30 35 41 / 0.12) 0%, transparent 22%, transparent 78%, rgb(30 35 41 / 0.14) 100%)',
].join(',')

export default function HeroSection() {
  return (
    <section className="relative -mt-[70px] pt-[70px] min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
        <Image
          src={HERO_SLIDE.image}
          alt={imageAltHero()}
          title={imageTitleHero()}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={75}
          className="object-cover"
        />
      </div>

      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden
        style={{ backgroundImage: heroOverlayBg }}
      />

      <div className="container-xl relative z-10 py-24">
        <div className="relative w-full">
          <div className="max-w-3xl">
            <h1 className="text-display text-text-inverse mb-6">
              <span className="text-accent">Автозвук</span>, світло, електроніка.
            </h1>

            <p className="text-lg text-white/88 leading-relaxed mb-10 max-w-xl">
              {HERO_SLIDE.description}
            </p>

            <div className="flex flex-col md:flex-row md:flex-wrap gap-3">
              <Link
                href={HERO_SLIDE.href}
                title={linkTitleHeroServices()}
                className={`block w-full md:w-auto ${buttonLinkClasses('primary', 'lg')} gap-2 micro-pop`}
              >
                {HERO_SLIDE.cta}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link
                href="/shop"
                title={linkTitleHeroShop()}
                className={`block w-full md:w-auto lg:min-w-[11.7rem] ${buttonLinkClasses('secondary', 'lg', true)} micro-pop`}
              >
                Знайти деталь
              </Link>
            </div>
          </div>

          <div className="mt-28 lg:mt-44 flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 lg:gap-12">
            <HeroConsultationLink />

            <div className="order-1 lg:order-2 grid grid-cols-3 gap-4 lg:flex lg:flex-nowrap lg:items-center lg:gap-10 lg:text-right w-full max-w-xl lg:max-w-none lg:w-auto lg:translate-x-4 mx-auto lg:mx-0">
              {STATS.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-impact text-text-inverse">{value}</p>
                  <p className="text-[11px] leading-tight text-text-inverse-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
