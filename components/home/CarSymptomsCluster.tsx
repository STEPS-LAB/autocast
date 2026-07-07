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
  /** lg+ organic canvas placement */
  desktopClass: string
  /** < lg bento offset */
  mobileClass?: string
}

const SYMPTOMS: SymptomItem[] = [
  {
    id: 'foggy-lights',
    title: 'Фари запітніли зсередини',
    bodyBefore: 'Халепа! Всередині фар утворилося справжнє болото. Акваріум — це чудово, але рибкам краще жити вдома, а не у Вашій оптиці. ',
    ctaLabel: 'Звʼяжіться з майстром',
    bodyAfter: ', щоб повернути фарам заводську герметичність.',
    desktopClass: 'lg:top-[3%] lg:left-[2%] lg:-rotate-1',
    mobileClass: 'sm:mr-6',
  },
  {
    id: 'flat-sound',
    title: 'Штатний звук став пласким і тихим',
    bodyBefore: 'Ну це жесть... Здається, Ваші улюблені виконавці просто втомилися співати у таких умовах і оголосили страйк. ',
    ctaLabel: 'Отримати прорахунок сцени',
    bodyAfter: ', щоб повернути музиці обʼєм та соковитий басс.',
    desktopClass: 'lg:top-[7%] lg:right-[3%] lg:rotate-2',
    mobileClass: 'sm:ml-10',
  },
  {
    id: 'frozen-screen',
    title: 'Екран магнітоли зависає взимку',
    bodyBefore: 'Катастрофа! Ваша мультимедіа просто впадає в сплячку, сумує за теплом і відмовляється думати. ',
    ctaLabel: 'Підібрати сучасну Android-систему',
    bodyAfter: ' з CarPlay, яка не боїться українських морозів.',
    desktopClass: 'lg:top-[26%] lg:left-[1%] lg:rotate-1',
    mobileClass: 'sm:mr-14',
  },
  {
    id: 'high-beams',
    title: 'Зустрічні водії постійно мигають Вам дальнім',
    bodyBefore: 'Спокійно, вони не вітаються! Ваше світло просто нещадно випалює їм очі через збиті налаштування або лінзи, що «втомилися». ',
    ctaLabel: 'Записатись на стенд',
    bodyAfter: ', щоб відрегулювати чітку світлотіньову межу.',
    desktopClass: 'lg:top-[30%] lg:right-[2%] lg:-rotate-2',
    mobileClass: 'sm:ml-6',
  },
  {
    id: 'road-noise',
    title: 'У салоні чути кожен камінчик і шелест шин',
    bodyBefore: 'Якась дичина... Якщо для розмови з пасажиром доводиться вмикати режим крику, Ваше авто більше схоже на консервну банку. ',
    ctaLabel: 'Замовити преміум-шумоізоляцію',
    bodyAfter: ' та нарешті насолодитися тишею.',
    desktopClass: 'lg:top-[50%] lg:left-[4%] lg:-rotate-1',
    mobileClass: 'sm:mr-8',
  },
  {
    id: 'door-anxiety',
    title: 'Доводиться тричі перевіряти, чи закрилися двері',
    bodyBefore: 'Повна тривожність! Оце забіг навколо машини — це виснажливо. ',
    ctaLabel: 'Дізнатися вартість',
    bodyAfter: ' встановлення надійної діалогової сигналізації з автозапуском з Вашого телефону.',
    desktopClass: 'lg:top-[54%] lg:right-[4%] lg:rotate-1',
    mobileClass: 'sm:ml-12',
  },
  {
    id: 'blurry-camera',
    title: 'Камера заднього виду показує «мильну» картинку з минулого століття',
    bodyBefore: 'Ну це вже ретро... Паркування наосліп по таких кадрах — це дуже дорогий атракціон. ',
    ctaLabel: 'Замінити камеру',
    bodyAfter: ' на чітку HD-оптику з динамічною розміткою, поки не зачепили чийсь бампер.',
    desktopClass: 'lg:bottom-[22%] lg:left-[7%] lg:rotate-2',
    mobileClass: 'sm:mr-4',
  },
  {
    id: 'dim-headlights',
    title: 'Світло фар стало тьмяним і жовтим, як у старого трамвая',
    bodyBefore: 'Повний морок! Нічні поїздки перетворилися на квест «вгадай, де яма на дорозі»? ',
    ctaLabel: 'Проконсультуватися щодо Bi-LED лінз',
    bodyAfter: ', які назавжди перетворять Вашу ніч на білий день.',
    desktopClass: 'lg:bottom-[18%] lg:right-[5%] lg:-rotate-1',
    mobileClass: 'sm:ml-8',
  },
  {
    id: 'speaker-crackle',
    title: 'Заводські колонки почали неприємно хрипіти на басах',
    bodyBefore: 'Слухайте, це не новий трек у стилі lo-fi... Це Ваші динаміки благають про пощаду та заміну. ',
    ctaLabel: 'Підібрати акустику',
    bodyAfter: ', яка розкачає салон під Ваші музичні вподобання.',
    desktopClass: 'lg:bottom-[5%] lg:left-[20%] lg:-rotate-2',
    mobileClass: 'sm:mr-16',
  },
  {
    id: 'warranty-fear',
    title: 'Потрібно встановити складну електроніку, а дилер лякає зняттям з гарантії',
    bodyBefore: 'Класична лякалка! Ми працюємо професійно, чисто та сертифіковано, тому Ваша гарантія залишиться абсолютно недоторканою. ',
    ctaLabel: 'Обговорити проект з інженером',
    bodyAfter: ' і спати спокійно.',
    desktopClass: 'lg:bottom-[7%] lg:right-[16%] lg:rotate-1',
    mobileClass: 'sm:ml-4',
  },
]

function SymptomResponse({ item }: { item: SymptomItem }) {
  return (
    <p className="text-sm leading-relaxed text-text-inverse-muted">
      {item.bodyBefore}
      <a
        href="#contact"
        className="inline font-semibold text-accent underline-offset-4 hover:underline transition-colors duration-500"
      >
        {item.ctaLabel}
      </a>
      {item.bodyAfter}
    </p>
  )
}

const DESKTOP_CARD =
  'w-full min-w-[300px] xl:min-w-[320px] max-w-[360px] xl:max-w-[400px] min-h-[200px] p-6'

function DesktopHoverFlipCard({ item, className }: { item: SymptomItem; className?: string }) {
  return (
    <div
      className={cn(
        'absolute z-20',
        DESKTOP_CARD,
        item.desktopClass,
        className,
      )}
    >
      <div
        tabIndex={0}
        className="group h-full w-full outline-none perspective-[1000px] rounded-2xl focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-deep"
      >
        <div
          className={cn(
            'relative h-full w-full transition-transform duration-500 ease-out transform-3d',
            'group-hover:transform-[rotateY(180deg)] group-focus-within:transform-[rotateY(180deg)]',
          )}
        >
          {/* Front */}
          <div
            className={cn(
              'absolute inset-0 flex items-center rounded-2xl border backface-hidden',
              'border-white/12 bg-white/6 backdrop-blur-sm',
              'transition-all duration-500',
              'group-hover:border-accent/35 group-hover:bg-white/10 group-hover:shadow-[0_28px_64px_-24px_rgb(255_193_7/0.35)]',
            )}
          >
            <p className="text-[15px] font-semibold text-text-inverse leading-snug">{item.title}</p>
          </div>

          {/* Back */}
          <div
            className={cn(
              'absolute inset-0 flex items-center rounded-2xl border backface-hidden transform-[rotateY(180deg)]',
              'border-accent/40 bg-graphite/95 shadow-[0_28px_64px_-24px_rgb(255_193_7/0.4)]',
            )}
          >
            <SymptomResponse item={item} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileExpandCard({
  item,
  isExpanded,
  onToggle,
  className,
}: {
  item: SymptomItem
  isExpanded: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <div className={cn('w-full max-w-lg', className, item.mobileClass)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left rounded-2xl border border-white/12 bg-white/6 backdrop-blur-sm transition-all duration-500 hover:border-accent/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <div className={cn('px-6 py-5 md:py-6 flex items-center')}>
          <p className="text-[15px] font-semibold text-text-inverse leading-snug">{item.title}</p>
        </div>
        <div
          className={cn(
            'grid transition-all duration-500 ease-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="px-6 pb-6 pt-0 border-t border-white/10">
              <SymptomResponse item={item} />
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

export default function CarSymptomsCluster() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleMobile = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }, [])

  return (
    <section className="relative overflow-hidden bg-graphite-deep py-20 md:py-32 lg:py-40 border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgb(255_193_7/0.06),transparent_55%)]" aria-hidden />

      <div className="container-xl relative mb-14 md:mb-20 lg:mb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-5">Діагностика за симптомом</p>
          <h2 className="text-headline text-text-inverse mb-5">Що турбує Ваш автомобіль?</h2>
          <p className="text-base md:text-lg text-text-inverse-muted leading-relaxed">
            Оберіть симптом, який Вас турбує, щоб дізнатися професійне рішення від наших майстрів (на картки можна наводити курсор).
          </p>
        </motion.div>
      </div>

      {/* Full-width organic canvas — desktop */}
      <div className="hidden lg:block w-full px-4 md:px-12 lg:px-20 max-w-none">
        <div className="relative mx-auto min-h-[1080px] xl:min-h-[1180px] 2xl:min-h-[1240px]">
          {/* Central logo — clear dead zone */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 select-none text-center px-8"
            aria-hidden
          >
            <p className="font-brand text-[clamp(3.25rem,6.5vw,5.5rem)] font-bold leading-none tracking-tight text-white/92">
              auto<span className="text-accent">cast</span>
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.35em] text-white/35">Житомир</p>
          </div>

          {SYMPTOMS.map(symptom => (
            <DesktopHoverFlipCard key={symptom.id} item={symptom} />
          ))}
        </div>
      </div>

      {/* Mobile & tablet — asymmetrical bento stack */}
      <div className="lg:hidden w-full px-4 md:px-12 max-w-none">
        <div className="mx-auto flex max-w-xl flex-col gap-5 md:gap-6">
          {SYMPTOMS.map(symptom => (
            <MobileExpandCard
              key={symptom.id}
              item={symptom}
              isExpanded={expandedId === symptom.id}
              onToggle={() => toggleMobile(symptom.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
