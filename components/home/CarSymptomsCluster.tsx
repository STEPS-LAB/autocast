'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface SymptomItem {
  id: string
  title: string
  bodyBefore: string
  ctaLabel: string
  bodyAfter: string
  /** Desktop scatter position (lg+) */
  position: string
}

const SYMPTOMS: SymptomItem[] = [
  {
    id: 'foggy-lights',
    title: 'Фари запітніли зсередини',
    bodyBefore: 'Халепа! Всередині фар утворилося справжнє болото. Акваріум — це чудово, але рибкам краще жити вдома, а не у Вашій оптиці. ',
    ctaLabel: 'Звʼяжіться з майстром',
    bodyAfter: ', щоб повернути фарам заводську герметичність.',
    position: 'lg:top-[6%] lg:left-[2%]',
  },
  {
    id: 'flat-sound',
    title: 'Штатний звук став пласким і тихим',
    bodyBefore: 'Ну це жесть... Здається, Ваші улюблені виконавці просто втомилися співати у таких умовах і оголосили страйк. ',
    ctaLabel: 'Отримати прорахунок сцени',
    bodyAfter: ', щоб повернути музиці обʼєм та соковитий бас.',
    position: 'lg:top-[10%] lg:right-[3%]',
  },
  {
    id: 'frozen-screen',
    title: 'Екран магнітоли зависає взимку',
    bodyBefore: 'Катастрофа! Ваша мультимедіа просто впадає в сплячку, сумує за теплом і відмовляється думати. ',
    ctaLabel: 'Підібрати сучасну Android-систему',
    bodyAfter: ' з CarPlay, яка не боїться українських морозів.',
    position: 'lg:top-[36%] lg:left-[0%]',
  },
  {
    id: 'high-beams',
    title: 'Зустрічні водії постійно мигають Вам дальнім',
    bodyBefore: 'Спокійно, вони не вітаються! Ваше світло просто нещадно випалює їм очі через збиті налаштування або лінзи, що «втомилися». ',
    ctaLabel: 'Записатись на стенд',
    bodyAfter: ', щоб відрегулювати чітку світлотіньову межу.',
    position: 'lg:top-[40%] lg:right-[1%]',
  },
  {
    id: 'road-noise',
    title: 'У салоні чути кожен камінчик і шелест шин',
    bodyBefore: 'Якась дичина... Якщо для розмови з пасажиром доводиться вмикати режим крику, Ваше авто більше схоже на консервну банку. ',
    ctaLabel: 'Замовити преміум-шумоізоляцію',
    bodyAfter: ' та нарешті насолодитися тишею.',
    position: 'lg:bottom-[34%] lg:left-[6%]',
  },
  {
    id: 'door-anxiety',
    title: 'Доводиться тричі перевіряти, чи закрилися двері',
    bodyBefore: 'Повна тривожність! Оце забіг навколо машини — це виснажливо. ',
    ctaLabel: 'Дізнатися вартість',
    bodyAfter: ' встановлення надійної діалогової сигналізації з автозапуском з Вашого телефону.',
    position: 'lg:bottom-[30%] lg:right-[5%]',
  },
  {
    id: 'blurry-camera',
    title: 'Камера заднього виду показує «мильну» картинку',
    bodyBefore: 'Ну це вже ретро... Паркування наосліп по таких кадрах — це дуже дорогий атракціон. ',
    ctaLabel: 'Замінити камеру',
    bodyAfter: ' на чітку HD-оптику з динамічною розміткою, поки не зачепили чийсь бампер.',
    position: 'lg:top-[20%] lg:left-[24%]',
  },
  {
    id: 'dim-headlights',
    title: 'Світло фар стало тьмяним і жовтим',
    bodyBefore: 'Повний морок! Нічні поїздки перетворилися на квест «вгадай, де яма на дорозі»? ',
    ctaLabel: 'Проконсультуватися щодо Bi-LED лінз',
    bodyAfter: ', які назавжди перетворять Вашу ніч на білий день.',
    position: 'lg:top-[22%] lg:right-[22%]',
  },
  {
    id: 'speaker-crackle',
    title: 'Заводські колонки хриплять на басах',
    bodyBefore: 'Слухайте, це не новий трек у стилі lo-fi... Це Ваші динаміки благають про пощаду та заміну. ',
    ctaLabel: 'Підібрати акустику',
    bodyAfter: ', яка розкачає салон під Ваші музичні вподобання.',
    position: 'lg:bottom-[10%] lg:left-[20%]',
  },
  {
    id: 'warranty-fear',
    title: 'Потрібно встановити електроніку, а дилер лякає гарантією',
    bodyBefore: 'Класична лякалка! Ми працюємо професійно, чисто та сертифіковано, тому Ваша гарантія залишиться абсолютно недоторканою. ',
    ctaLabel: 'Обговорити проект з інженером',
    bodyAfter: ' і спати спокійно.',
    position: 'lg:bottom-[12%] lg:right-[18%]',
  },
]

function scrollToContact() {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SymptomResponse({ item }: { item: SymptomItem }) {
  return (
    <p className="text-sm md:text-base leading-relaxed text-text-inverse-muted">
      {item.bodyBefore}
      <button
        type="button"
        onClick={scrollToContact}
        className="inline font-semibold text-accent underline-offset-4 hover:underline transition-colors duration-300"
      >
        {item.ctaLabel}
      </button>
      {item.bodyAfter}
    </p>
  )
}

export default function CarSymptomsCluster() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = SYMPTOMS.find(s => s.id === activeId) ?? null

  const toggle = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id))
  }, [])

  return (
    <section className="relative overflow-hidden bg-graphite-deep py-24 md:py-32 border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgb(255_193_7/0.06),transparent_55%)]" aria-hidden />

      <div className="container-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto text-center mb-14 md:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-3">Діагностика за симптомом</p>
          <h2 className="text-headline text-text-inverse mb-4">Що турбує Ваш автомобіль?</h2>
          <p className="text-base md:text-lg text-text-inverse-muted leading-relaxed">
            Оберіть симптом, який Вас турбує, щоб дізнатися професійне рішення від наших майстрів (на картки можна клікати).
          </p>
        </motion.div>

        {/* Mobile: horizontal snap carousel */}
        <div className="lg:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SYMPTOMS.map((symptom, index) => {
              const isActive = activeId === symptom.id
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggle(symptom.id)}
                  className={cn(
                    'snap-center shrink-0 w-[min(82vw,18rem)] text-left rounded-xl border p-4',
                    'transition-all duration-300 ease-out',
                    isActive
                      ? 'border-accent/50 bg-white/12 shadow-[0_20px_48px_-20px_rgb(255_193_7/0.35)] scale-[1.02]'
                      : 'border-white/12 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.08]'
                  )}
                  style={{ transitionDelay: `${index * 20}ms` }}
                >
                  <span className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="block text-sm font-semibold text-text-inverse leading-snug">{symptom.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop: floating constellation */}
        <div className="relative hidden lg:block mx-auto max-w-6xl min-h-[680px]">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 select-none text-center"
            aria-hidden
          >
            <p className="font-brand text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-none tracking-tight text-white/90">
              auto<span className="text-accent">cast</span>
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.35em] text-white/35">Житомир</p>
          </div>

          {SYMPTOMS.map((symptom, index) => {
            const isActive = activeId === symptom.id
            return (
              <button
                key={symptom.id}
                type="button"
                onClick={() => toggle(symptom.id)}
                className={cn(
                  'absolute z-20 max-w-[14rem] xl:max-w-[15rem] text-left rounded-xl border p-4',
                  'transition-all duration-300 ease-out hover:-translate-y-1',
                  symptom.position,
                  isActive
                    ? 'border-accent/55 bg-white/14 shadow-[0_24px_56px_-18px_rgb(255_193_7/0.4)] scale-105'
                    : 'border-white/12 bg-white/[0.06] hover:border-accent/30 hover:bg-white/[0.1]'
                )}
              >
                <span className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                  {index + 1}
                </span>
                <span className="block text-sm font-semibold text-text-inverse leading-snug">{symptom.title}</span>
              </button>
            )
          })}
        </div>

        {/* Shared expert response panel */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 md:mt-14 max-w-3xl mx-auto rounded-2xl border border-white/12 bg-white/[0.06] p-6 md:p-8 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent font-medium mb-1">Експертна відповідь</p>
                  <h3 className="text-lg font-semibold text-text-inverse">{active.title}</h3>
                </div>
              </div>
              <SymptomResponse item={active} />
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={scrollToContact}
                  className="gap-2 transition-transform duration-300 hover:scale-105"
                >
                  Залишити контакти
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
