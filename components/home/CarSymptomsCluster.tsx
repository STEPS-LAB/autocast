'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SymptomItem {
  id: string
  title: string
  bodyBefore: string
  ctaLabel: string
  bodyAfter: string
  /** lg+ grid placement */
  gridClass: string
}

const SYMPTOMS: SymptomItem[] = [
  {
    id: 'foggy-lights',
    title: 'Фари запітніли зсередини',
    bodyBefore: 'Халепа! Всередині фар утворилося справжнє болото. Акваріум — це чудово, але рибкам краще жити вдома, а не у Вашій оптиці. ',
    ctaLabel: 'Звʼяжіться з майстром',
    bodyAfter: ', щоб повернути фарам заводську герметичність.',
    gridClass: 'lg:col-start-1 lg:row-start-1',
  },
  {
    id: 'flat-sound',
    title: 'Штатний звук став пласким і тихим',
    bodyBefore: 'Ну це жесть... Здається, Ваші улюблені виконавці просто втомилися співати у таких умовах і оголосили страйк. ',
    ctaLabel: 'Отримати прорахунок сцени',
    bodyAfter: ', щоб повернути музиці обʼєм та соковитий бас.',
    gridClass: 'lg:col-start-2 lg:row-start-1',
  },
  {
    id: 'frozen-screen',
    title: 'Екран магнітоли зависає взимку',
    bodyBefore: 'Катастрофа! Ваша мультимедіа просто впадає в сплячку, сумує за теплом і відмовляється думати. ',
    ctaLabel: 'Підібрати сучасну Android-систему',
    bodyAfter: ' з CarPlay, яка не боїться українських морозів.',
    gridClass: 'lg:col-start-4 lg:row-start-1',
  },
  {
    id: 'high-beams',
    title: 'Зустрічні водії мигають Вам дальнім',
    bodyBefore: 'Спокійно, вони не вітаються! Ваше світло просто нещадно випалює їм очі через збиті налаштування або лінзи, що «втомилися». ',
    ctaLabel: 'Записатись на стенд',
    bodyAfter: ', щоб відрегулювати чітку світлотіньову межу.',
    gridClass: 'lg:col-start-5 lg:row-start-1',
  },
  {
    id: 'road-noise',
    title: 'У салоні чути кожен камінчик',
    bodyBefore: 'Якась дичина... Якщо для розмови з пасажиром доводиться вмикати режим крику, Ваше авто більше схоже на консервну банку. ',
    ctaLabel: 'Замовити преміум-шумоізоляцію',
    bodyAfter: ' та нарешті насолодитися тишею.',
    gridClass: 'lg:col-start-1 lg:row-start-2',
  },
  {
    id: 'door-anxiety',
    title: 'Тричі перевіряєте, чи закрилися двері',
    bodyBefore: 'Повна тривожність! Оце забіг навколо машини — це виснажливо. ',
    ctaLabel: 'Дізнатися вартість',
    bodyAfter: ' встановлення надійної діалогової сигналізації з автозапуском з Вашого телефону.',
    gridClass: 'lg:col-start-5 lg:row-start-2',
  },
  {
    id: 'blurry-camera',
    title: 'Камера показує «мильну» картинку',
    bodyBefore: 'Ну це вже ретро... Паркування наосліп по таких кадрах — це дуже дорогий атракціон. ',
    ctaLabel: 'Замінити камеру',
    bodyAfter: ' на чітку HD-оптику з динамічною розміткою, поки не зачепили чийсь бампер.',
    gridClass: 'lg:col-start-1 lg:row-start-4',
  },
  {
    id: 'dim-headlights',
    title: 'Світло фар тьмяне і жовте',
    bodyBefore: 'Повний морок! Нічні поїздки перетворилися на квест «вгадай, де яма на дорозі»? ',
    ctaLabel: 'Проконсультуватися щодо Bi-LED лінз',
    bodyAfter: ', які назавжди перетворять Вашу ніч на білий день.',
    gridClass: 'lg:col-start-5 lg:row-start-4',
  },
  {
    id: 'speaker-crackle',
    title: 'Колонки хриплять на басах',
    bodyBefore: 'Слухайте, це не новий трек у стилі lo-fi... Це Ваші динаміки благають про пощаду та заміну. ',
    ctaLabel: 'Підібрати акустику',
    bodyAfter: ', яка розкачає салон під Ваші музичні вподобання.',
    gridClass: 'lg:col-start-2 lg:row-start-5',
  },
  {
    id: 'warranty-fear',
    title: 'Дилер лякає зняттям з гарантії',
    bodyBefore: 'Класична лякалка! Ми працюємо професійно, чисто та сертифіковано, тому Ваша гарантія залишиться абсолютно недоторканою. ',
    ctaLabel: 'Обговорити проект з інженером',
    bodyAfter: ' і спати спокійно.',
    gridClass: 'lg:col-start-4 lg:row-start-5',
  },
]

function SymptomResponse({ item }: { item: SymptomItem }) {
  return (
    <p className="text-xs sm:text-sm leading-relaxed text-text-inverse-muted">
      {item.bodyBefore}
      <a
        href="#contact"
        className="inline font-semibold text-accent underline-offset-4 hover:underline transition-colors duration-300"
      >
        {item.ctaLabel}
      </a>
      {item.bodyAfter}
    </p>
  )
}

interface FlipSymptomCardProps {
  item: SymptomItem
  index: number
  isFlipped: boolean
  onToggle: () => void
  className?: string
}

function FlipSymptomCard({ item, index, isFlipped, onToggle, className }: FlipSymptomCardProps) {
  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isFlipped}
        aria-label={`${item.title}. ${isFlipped ? 'Згорнути відповідь' : 'Показати відповідь майстра'}`}
        className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-deep rounded-xl"
      >
        <div className="perspective-distant w-full">
          <div
            className={cn(
              'relative w-full min-h-38 sm:min-h-42 lg:min-h-34 xl:min-h-36',
              'transition-transform duration-500 ease-out transform-3d',
              isFlipped && 'transform-[rotateY(180deg)]',
            )}
          >
            {/* Front */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col rounded-xl border p-4 backface-hidden',
                'border-white/12 bg-white/6',
                'transition-colors duration-300',
                'group-hover:border-accent/35 group-hover:bg-white/10',
                isFlipped && 'pointer-events-none',
              )}
            >
              <span className="mb-2 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-text-inverse leading-snug">{item.title}</span>
              <span className="mt-auto pt-3 text-[11px] uppercase tracking-wider text-white/35">
                Натисніть, щоб відкрити
              </span>
            </div>

            {/* Back */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col rounded-xl border p-4 overflow-y-auto backface-hidden transform-[rotateY(180deg)]',
                'border-accent/40 bg-graphite/90 shadow-[0_20px_48px_-20px_rgb(255_193_7/0.3)]',
                !isFlipped && 'pointer-events-none',
              )}
            >
              <p className="text-[11px] uppercase tracking-wider text-accent font-medium mb-2">Відповідь майстра</p>
              <SymptomResponse item={item} />
              <span className="mt-auto pt-3 text-[11px] text-white/35">Натисніть, щоб згорнути</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

export default function CarSymptomsCluster() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id))
  }, [])

  return (
    <section className="relative overflow-hidden bg-graphite-deep py-16 md:py-28 lg:py-36 border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgb(255_193_7/0.06),transparent_55%)]" aria-hidden />

      <div className="container-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto text-center mb-12 md:mb-16 lg:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-4">Діагностика за симптомом</p>
          <h2 className="text-headline text-text-inverse mb-5">Що турбує Ваш автомобіль?</h2>
          <p className="text-base md:text-lg text-text-inverse-muted leading-relaxed">
            Оберіть симптом, який Вас турбує, щоб дізнатися професійне рішення від наших майстрів (на картки можна клікати).
          </p>
        </motion.div>

        {/* Mobile & tablet: bento stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 lg:hidden">
          {SYMPTOMS.map((symptom, index) => (
            <FlipSymptomCard
              key={symptom.id}
              item={symptom}
              index={index}
              isFlipped={activeId === symptom.id}
              onToggle={() => toggle(symptom.id)}
              className={cn(
                index % 5 === 0 && 'sm:col-span-2 sm:max-w-lg sm:mx-auto sm:w-full',
              )}
            />
          ))}
        </div>

        {/* Desktop: non-overlapping 5×5 grid with centered logo */}
        <div
          className={cn(
            'hidden lg:grid mx-auto max-w-6xl',
            'grid-cols-5 grid-rows-5',
            'gap-x-6 gap-y-8 xl:gap-x-8 xl:gap-y-10',
            'px-4 xl:px-8 py-8 xl:py-12',
          )}
        >
          {SYMPTOMS.map((symptom, index) => (
            <FlipSymptomCard
              key={symptom.id}
              item={symptom}
              index={index}
              isFlipped={activeId === symptom.id}
              onToggle={() => toggle(symptom.id)}
              className={symptom.gridClass}
            />
          ))}

          <div
            className="lg:col-start-3 lg:row-start-2 lg:row-span-3 flex items-center justify-center pointer-events-none select-none px-4"
            aria-hidden
          >
            <div className="text-center">
              <p className="font-brand text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-none tracking-tight text-white/90">
                auto<span className="text-accent">cast</span>
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/35">Житомир</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
