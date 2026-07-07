'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SymptomPosition {
  top?: string
  left?: string
  right?: string
  bottom?: string
}

interface SymptomItem {
  id: string
  title: string
  bodyBefore: string
  ctaLabel: string
  bodyAfter: string
  position: SymptomPosition
}

const SYMPTOMS: SymptomItem[] = [
  {
    id: 'foggy-lights',
    title: 'Фари запітніли зсередини',
    bodyBefore:
      'Халепа! Всередині фар утворилося справжнє болото. Акваріум — це чудово, але рибкам краще жити вдома, а не у Вашій оптиці. ',
    ctaLabel: 'Звʼяжіться з майстром',
    bodyAfter: ', щоб повернути фарам заводську герметичність.',
    position: { top: '5%', left: '2%' },
  },
  {
    id: 'flat-sound',
    title: 'Штатний звук став пласким і тихим',
    bodyBefore:
      'Ну це жесть... Здається, Ваші улюблені виконавці просто втомилися співати у таких умовах і оголосили страйк. ',
    ctaLabel: 'Отримати прорахунок сцени',
    bodyAfter: ', щоб повернути музиці обʼєм та соковитий басс.',
    position: { top: '4%', right: '2%' },
  },
  {
    id: 'frozen-screen',
    title: 'Екран магнітоли зависає взимку',
    bodyBefore:
      'Катастрофа! Ваша мультимедіа просто впадає в сплячку, сумує за теплом і відмовляється думати. ',
    ctaLabel: 'Підібрати сучасну Android-систему',
    bodyAfter: ' з CarPlay, яка не боїться українських морозів.',
    position: { top: '24%', left: '18%' },
  },
  {
    id: 'high-beams',
    title: 'Зустрічні водії постійно мигають Вам дальнім',
    bodyBefore:
      'Спокійно, вони не вітаються! Ваше світло просто нещадно випалює їм очі через збиті налаштування або лінзи, що «втомилися». ',
    ctaLabel: 'Записатись на стенд',
    bodyAfter: ', щоб відрегулювати чітку світлотіньову межу.',
    position: { top: '22%', right: '18%' },
  },
  {
    id: 'road-noise',
    title: 'У салоні чути кожен камінчик і шелест шин',
    bodyBefore:
      'Якась дичина... Якщо для розмови з пасажиром доводиться вмикати режим крику, Ваше авто більше схоже на консервну банку. ',
    ctaLabel: 'Замовити преміум-шумоізоляцію',
    bodyAfter: ' та нарешті насолодитися тишею.',
    position: { top: '45%', left: '1%' },
  },
  {
    id: 'door-anxiety',
    title: 'Доводиться тричі перевіряти, чи закрилися двері',
    bodyBefore: 'Повна тривожність! Оце забіг навколо машини — це виснажливо. ',
    ctaLabel: 'Дізнатися вартість',
    bodyAfter:
      ' встановлення надійної діалогової сигналізації з автозапуском з Вашого телефону.',
    position: { top: '42%', right: '1%' },
  },
  {
    id: 'blurry-camera',
    title: 'Камера заднього виду показує «мильну» картинку з минулого століття',
    bodyBefore:
      'Ну це вже ретро... Паркування наосліп по таких кадрах — це дуже дорогий атракціон. ',
    ctaLabel: 'Замінити камеру',
    bodyAfter:
      ' на чітку HD-оптику з динамічною розміткою, поки не зачепили чийсь бампер.',
    position: { bottom: '26%', left: '15%' },
  },
  {
    id: 'dim-headlights',
    title: 'Світло фар стало тьмяним і жовтим, як у старого трамвая',
    bodyBefore:
      'Повний морок! Нічні поїздки перетворилися на квест «вгадай, де яма на дорозі»? ',
    ctaLabel: 'Проконсультуватися щодо Bi-LED лінз',
    bodyAfter: ', які назавжди перетворять Вашу ніч на білий день.',
    position: { bottom: '24%', right: '15%' },
  },
  {
    id: 'speaker-crackle',
    title: 'Заводські колонки почали неприємно хрипіти на басах',
    bodyBefore:
      'Слухайте, це не новий трек у стилі lo-fi... Це Ваші динаміки благають про пощаду та заміну. ',
    ctaLabel: 'Підібрати акустику',
    bodyAfter: ', яка розкачає салон під Ваші музичні вподобання.',
    position: { bottom: '5%', left: '5%' },
  },
  {
    id: 'warranty-fear',
    title: 'Потрібно встановити складну електроніку, а дилер лякає зняттям з гарантії',
    bodyBefore:
      'Класична лякалка! Ми працюємо професійно, чисто та сертифіковано, тому Ваша гарантія залишиться абсолютно недоторканою. ',
    ctaLabel: 'Обговорити проект з інженером',
    bodyAfter: ' і спати спокійно.',
    position: { bottom: '4%', right: '5%' },
  },
]

function MasterAnswer({ item }: { item: SymptomItem }) {
  return (
    <p className="text-gray-300 text-sm leading-relaxed">
      {item.bodyBefore}
      <a
        href="#contact"
        className="text-[#FFBB00] underline font-semibold mt-2 cursor-pointer inline hover:text-white transition-colors duration-500"
      >
        {item.ctaLabel}
      </a>
      {item.bodyAfter}
    </p>
  )
}

function DesktopFlipCard({ item }: { item: SymptomItem }) {
  return (
    <div
      className="group w-[calc(50vw-20px)] max-w-[360px] lg:max-w-[380px] h-[160px] [perspective:1000px] absolute z-20"
      style={item.position}
    >
      <div className="relative w-full h-full duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front — symptom */}
        <div className="absolute inset-0 w-full h-full p-6 bg-[#1A1D21] border border-white/10 rounded-xl flex items-center justify-center text-center [backface-visibility:hidden]">
          <p className="text-white font-medium text-base leading-snug">{item.title}</p>
        </div>

        {/* Back — master's answer */}
        <div className="absolute inset-0 w-full h-full p-6 bg-[#22252A] border border-[#FFBB00]/30 rounded-xl flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <MasterAnswer item={item} />
        </div>
      </div>
    </div>
  )
}

function MobileAccordionCard({
  item,
  isOpen,
  onToggle,
}: {
  item: SymptomItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#1A1D21] overflow-hidden transition-colors duration-500">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBB00]/50"
      >
        <p className="text-white font-medium text-base leading-snug">{item.title}</p>
      </button>

      <div
        className={cn(
          'grid transition-all duration-500 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 bg-[#22252A] p-6">
            <MasterAnswer item={item} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CarSymptomsCluster() {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleMobile = useCallback((id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }, [])

  return (
    <section className="relative overflow-hidden bg-graphite-deep py-20 md:py-32 lg:py-40 border-y border-white/10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgb(255_187_0/0.06),transparent_55%)]"
        aria-hidden
      />

      {/* Section header */}
      <div className="container-xl relative mb-14 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#FFBB00] font-medium mb-5">
            Діагностика за симптомом
          </p>
          <h2 className="text-headline text-text-inverse mb-5">Що турбує Ваш автомобіль?</h2>
          <p className="text-base md:text-lg text-text-inverse-muted leading-relaxed">
            Оберіть симптом, який Вас турбує, щоб дізнатися професійне рішення від наших майстрів.
          </p>
        </motion.div>
      </div>

      {/* Desktop — absolute organic canvas with 3D hover flip */}
      <div className="hidden md:block w-full px-4 md:px-12 lg:px-20">
        <div className="relative w-full min-h-[950px] lg:min-h-[1050px] overflow-visible py-20 mx-auto max-w-[1400px]">
          {/* Central logo */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 select-none text-center"
            aria-hidden
          >
            <p className="font-brand text-[clamp(3rem,6vw,5rem)] font-bold leading-none tracking-tight text-white/92">
              auto<span className="text-[#FFBB00]">cast</span>
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/35">Житомир</p>
          </div>

          {SYMPTOMS.map(symptom => (
            <DesktopFlipCard key={symptom.id} item={symptom} />
          ))}
        </div>
      </div>

      {/* Mobile — simple accordion stack, no absolute positioning */}
      <div className="md:hidden flex flex-col gap-4 w-full px-4">
        {SYMPTOMS.map(symptom => (
          <MobileAccordionCard
            key={symptom.id}
            item={symptom}
            isOpen={openId === symptom.id}
            onToggle={() => toggleMobile(symptom.id)}
          />
        ))}
      </div>
    </section>
  )
}
