import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'
import Button from '@/components/ui/Button'
import ServiceCard from '@/components/services/ServiceCard'
import ServiceFaqAccordion from '@/components/services/ServiceFaqAccordion'
import { CornerAccentLines, DiagonalStripes } from '@/components/services/ServiceSectionDecor'
import { getRelatedServices, getServiceBySlug, SERVICES } from '@/lib/data/services'
import { getSiteUrl } from '@/lib/supabase/env'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return { title: 'Послуга не знайдена' }
  const siteUrl = getSiteUrl()
  const url = `${siteUrl}/services/${service.slug}`
  const ogImageUrl = service.image.startsWith('/') ? `${siteUrl}${service.image}` : service.image
  return {
    title: service.title,
    description: service.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: service.title,
      description: service.metaDescription,
      images: [{ url: ogImageUrl, width: 1600, height: 1000, alt: service.title }],
    },
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const related = getRelatedServices(service.relatedSlugs)

  return (
    <PageTransition>
      <article>
        {/* Hero — повноекранний фон */}
        <section className="relative flex min-h-[min(85vh,45rem)] flex-col overflow-hidden">
          <Image
            src={service.image}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-deep/78 via-graphite-deep/55 to-graphite-deep/38"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-graphite-deep/72 via-graphite-deep/22 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_70%_20%,rgb(255_193_7/0.1),transparent_55%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 noise-overlay opacity-25" aria-hidden />

          <div className="relative z-10 flex flex-1 flex-col">
            <div className="container-xl pt-24 pb-6 md:pt-28">
              <nav className="flex flex-wrap items-center gap-1 text-sm text-white/65">
                <Link href="/" className="transition-colors hover:text-accent">
                  Головна
                </Link>
                <ChevronRight size={14} className="shrink-0 opacity-70" aria-hidden />
                <Link href="/services" className="transition-colors hover:text-accent">
                  Послуги
                </Link>
                <ChevronRight size={14} className="shrink-0 opacity-70" aria-hidden />
                <span className="font-medium text-white/95">{service.title}</span>
              </nav>
            </div>

            <div className="container-xl flex flex-1 flex-col justify-end pb-12 pt-4 md:pb-16 md:pt-8">
              <div className="max-w-2xl">
                <h1 className="mb-4 text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-4xl md:text-[2.35rem] md:leading-[1.15]">
                  {service.title}
                </h1>
                <p className="mb-8 text-lg leading-relaxed text-white/82">{service.intro}</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact">
                    <Button size="lg" className="micro-pop">
                      Звʼязатися
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button
                      size="lg"
                      variant="secondary"
                      className={cn(
                        'micro-pop border-white/25 bg-white/10 text-text-inverse',
                        'hover:border-white/40 hover:bg-white/16'
                      )}
                    >
                      Переглянути магазин
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Що входить */}
        <section className="relative overflow-hidden py-16 md:py-20">
          <div className="container-xl relative">
            <div className="mb-10 max-w-2xl">
              <span className="mb-2 inline-flex h-1 w-12 rounded-full bg-gradient-to-r from-accent to-accent/40" aria-hidden />
              <h2 className="text-headline text-text-primary">Що входить у роботу</h2>
              <p className="mt-2 text-sm text-text-muted">Прозорий перелік етапів — без «сюрпризів» у кошторисі.</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {service.whatIncluded.map(item => {
                const ItemIcon = item.icon
                return (
                <li key={item.text}>
                  <div
                    className={cn(
                      'group relative h-full overflow-hidden rounded-xl border border-border/80 bg-bg-surface/85 p-4 shadow-sm backdrop-blur-sm',
                      'motion-safe:transition-[translate,box-shadow,border-color,background-color] motion-safe:duration-300 motion-safe:ease-out',
                      'hover:-translate-y-1 hover:border-accent/30 hover:bg-bg-surface hover:shadow-[0_16px_40px_-18px_rgb(15_23_42/0.12)]'
                    )}
                  >
                    <span
                      className={cn(
                        'mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-accent/12 text-accent',
                        'ring-1 ring-accent/20 motion-safe:transition-[transform,background-color] motion-safe:duration-300',
                        'group-hover:scale-110 group-hover:bg-accent/18'
                      )}
                    >
                      <ItemIcon size={14} strokeWidth={2.25} aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed text-text-secondary transition-colors duration-200 group-hover:text-text-primary">
                      {item.text}
                    </p>
                    <div className="pointer-events-none absolute -right-6 bottom-0 h-20 w-20 rounded-full bg-accent/[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
                  </div>
                </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Як ми працюємо */}
        <section className="relative border-y border-border/70 bg-gradient-to-b from-bg-primary via-bg-surface/40 to-bg-primary py-16 md:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
          <div className="container-xl relative">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="mb-2 inline-flex h-1 w-12 rounded-full bg-gradient-to-r from-graphite-muted to-transparent" aria-hidden />
                <h2 className="text-headline text-text-primary">Як ми працюємо</h2>
              </div>
              <p className="max-w-md text-sm text-text-muted md:text-right">
                Від першого контакту до здачі — зрозумілий процес і фіксовані очікування.
              </p>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute left-0 right-0 top-[2.25rem] hidden h-px bg-gradient-to-r from-border via-accent/25 to-border lg:block"
                aria-hidden
              />
              <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {service.howSteps.map((step, i) => (
                <li key={step.title} className="relative">
                  <div
                    className={cn(
                      'group relative h-full overflow-hidden rounded-xl border border-border/80 bg-bg-surface/90 p-5 shadow-sm backdrop-blur-sm',
                      'motion-safe:transition-[translate,box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-out',
                      'hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_20px_44px_-20px_rgb(30_35_41/0.18)]'
                    )}
                  >
                    <span
                      className={cn(
                        'relative z-[1] mb-4 inline-flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-text-primary',
                        'shadow-[0_0_0_4px_rgb(255_193_7/0.15)] transition-transform duration-300',
                        'group-hover:scale-105'
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3 className="relative z-[1] mb-2 text-base font-semibold text-text-primary transition-colors group-hover:text-accent">
                      {step.title}
                    </h3>
                    <p className="relative z-[1] text-sm leading-relaxed text-text-secondary">{step.text}</p>
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/[0.07] blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
                  </div>
                </li>
              ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Чому це важливо */}
        <section className="relative overflow-hidden py-16 md:py-20">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 text-text-muted/15">
            <DiagonalStripes className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute bottom-8 right-8 text-accent/20 md:right-16">
            <CornerAccentLines className="h-28 w-28 rotate-180" />
          </div>

          <div className="container-xl relative">
            <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start lg:gap-14">
              <div>
                <h2 className="text-headline text-text-primary mb-4">Чому це важливо</h2>
                <p className="text-text-secondary leading-relaxed mb-8 max-w-prose">{service.whyIntro}</p>
                <ul className="space-y-3">
                  {service.whyMatters.map(item => (
                    <li key={item}>
                      <div
                        className={cn(
                          'group flex gap-4 rounded-xl border border-transparent bg-bg-surface/60 px-4 py-3 transition-all duration-300',
                          'hover:border-border hover:bg-bg-surface hover:shadow-md'
                        )}
                      >
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-accent shadow-[0_0_12px_rgb(255_193_7/0.45)] transition-transform duration-300 group-hover:scale-125"
                          aria-hidden
                        />
                        <span className="text-sm text-text-secondary leading-relaxed transition-colors group-hover:text-text-primary">
                          {item}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-graphite-deep via-graphite-deep to-graphite p-6 text-text-inverse shadow-[0_24px_60px_-24px_rgb(0_0_0/0.35)]',
                  'lg:self-end transition-shadow duration-300 hover:shadow-[0_28px_64px_-20px_rgb(0_0_0/0.42)]'
                )}
              >
                <div className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
                <p className="relative text-sm font-medium leading-relaxed text-text-inverse-muted">
                  У майстерні Autocast монтаж виконується з дотриманням заводської логіки проводки та безпеки
                  ланцюгів живлення — це основа довговічної роботи системи.
                </p>
                <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-6">
                  <span className="h-8 w-1 rounded-full bg-accent" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Autocast</span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/60 bg-bg-surface/50 py-16 md:py-20">
          <div className="container-xl max-w-3xl">
            <h2 className="text-headline text-text-primary mb-3">Часті запитання</h2>
            <p className="mb-8 text-sm text-text-muted">
              Коротко відповідаємо на типові питання перед записом. Деталі щодо вашого авто уточнимо на консультації.
            </p>
            <ServiceFaqAccordion faqs={service.faqs} />
          </div>
        </section>

        {/* Інші послуги */}
        <section className="relative py-16 md:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(72rem,95vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="container-xl">
            <h2 className="text-headline text-text-primary mb-10">Інші послуги</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {related.map((s, index) => (
                <ServiceCard
                  key={s.slug}
                  slug={s.slug}
                  variant="light"
                  index={index}
                  hideIconBadgeBorder
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 pt-4 md:pb-24">
          <div className="container-xl">
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl border border-white/10 p-8 md:p-11',
                'bg-graphite-deep text-text-inverse shadow-[0_24px_64px_-28px_rgb(0_0_0/0.45)]',
                'transition-[transform,box-shadow] duration-300 hover:shadow-[0_28px_72px_-24px_rgb(0_0_0/0.5)]'
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_0%,rgb(255_193_7/0.08),transparent_50%)]" />
              <div className="pointer-events-none absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-accent/40 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-r from-accent/25 to-transparent" />

              <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-text-inverse">Готові обговорити проєкт?</h2>
                  <p className="max-w-xl text-sm leading-relaxed text-text-inverse-muted">
                    Залиште заявку або зателефонуйте — підкажемо оптимальну комплектацію та терміни без зайвих робіт.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link href="/contact">
                    <Button className="micro-pop">Звʼязатися</Button>
                  </Link>
                  <Link href="/services">
                    <Button
                      variant="secondary"
                      className="micro-pop border-text-inverse-muted/35 bg-white/8 text-text-inverse hover:border-text-inverse-muted/50 hover:bg-white/12"
                    >
                      Усі послуги
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </article>
    </PageTransition>
  )
}
