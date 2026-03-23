'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/types'
import { generateId } from '@/lib/utils'

const SUGGESTIONS = [
  'Яка магнітола краще для BMW?',
  'LED лампи H7 — що порадите?',
  'Порівняйте Pioneer та Alpine',
  'Кращий GPS трекер 2024',
]

const AI_RESPONSES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /bmw|бмв/i,
    reply: 'Для BMW рекомендую **Pioneer SPH-DA360DAB** — бездротовий CarPlay та Android Auto, ідеально інтегрується з CAN-шиною BMW. Також підійде **Alpine IVE-W530E** — преміальний звук та дизайн.',
  },
  {
    pattern: /магнітол|магнітол|stereo|headunit/i,
    reply: 'Топ вибір для 2024:\n1. **Pioneer SPH-DA360DAB** — бездротовий CarPlay/AA\n2. **Teyes CC3** — Android 10, 4+32GB, 10" QLED\n3. **Alpine IVE-W530E** — преміальний звук\n\nЯкий автомобіль? Підберу точніше!',
  },
  {
    pattern: /led|лед|лампи|lamp/i,
    reply: 'Для LED ламп рекомендую:\n• **H7 CANBUS 6000K 80W** — яскраво, без помилок на панелі\n• **Bi-LED H4 5500K** — ідеальна лінія світла\n\nЗвертайте увагу на клас IP68 та наявність CANBUS для уникнення помилок.',
  },
  {
    pattern: /pioneer|піонер/i,
    reply: '**Pioneer** — одна з найнадійніших марок автозвуку. Рекомендую **AVH-X8700BT** або **SPH-DA360DAB**. Відмінний звук, тривалий ресурс, широка підтримка форматів.',
  },
  {
    pattern: /alpine|алпайн/i,
    reply: '**Alpine** відомий преміальним звуком та якістю збірки. **IVE-W530E** — класичний вибір з DVD та Bluetooth. Для топ-якості звуку розгляньте також підсилювачі Alpine.',
  },
  {
    pattern: /gps|навігат|трекер|tracker/i,
    reply: 'Для GPS навігації:\n• **Garmin DriveSmart 65** — 7" екран, голосове керування, карти Європи\n• **70mai A800S** — відеореєстратор + GPS в одному\n\nДля захисту авто: **Concox GT06N** — прихований трекер з 4G.',
  },
  {
    pattern: /сигналіз|starline|старлайн|alarm/i,
    reply: '**StarLine A93** — найкращий вибір для охорони:\n✓ GSM/GPS 4G\n✓ Автозапуск\n✓ Управління зі смартфону\n✓ Захист від злому CAN/LIN\n\nВстановлення краще довірити спеціалісту.',
  },
  {
    pattern: /реєстратор|dashcam|dash cam|відеор/i,
    reply: 'Топ відеореєстратори:\n1. **Vantrue N4 Pro** — 3 камери, 4K+1080P+1080P, Sony сенсор\n2. **70mai A800S** — 4K UHD, GPS, ADAS\n\nДля максимального захисту обирайте моделі з Sony IMX сенсором.',
  },
  {
    pattern: /brembo|bosch|compare|порівн/i,
    reply: 'Порівняння брендів залежить від категорії. Уточніть, що саме порівнюємо (гальма, фільтри, електроніка)? Я підберу найкращий варіант для вашого автомобіля.',
  },
  {
    pattern: /ціна|price|вартість|cost/i,
    reply: 'Ціни у нас прозорі та конкурентні. Більшість товарів доступні від 1 000₴. Топові мультимедіа — 4 000–15 000₴. Є регулярні акції та знижки до 31%!',
  },
  {
    pattern: /доставк|delivery|nova|нова пошт/i,
    reply: 'Доставляємо по всій Україні:\n📦 **Нова пошта** — 1-2 дні\n📫 **Укрпошта** — 2-5 днів\n🏪 **Самовивіз** — Київ, безкоштовно\n\nОплата при отриманні або онлайн.',
  },
]

const GREETING: AIMessage = {
  id: 'greeting',
  role: 'assistant',
  content: 'Привіт! Я AI-консультант Autocast 🚗\n\nДопоможу підібрати автозапчастини та електроніку для вашого автомобіля. Запитайте про будь-який товар або характеристики!',
  timestamp: new Date(),
}

function getAIResponse(message: string): string {
  for (const { pattern, reply } of AI_RESPONSES) {
    if (pattern.test(message)) return reply
  }
  return 'Гарне питання! Уточніть, будь ласка, марку та модель вашого авто — я підберу найкращий варіант серед нашого каталогу. Також можете переглянути наш **магазин** або скористатися пошуком на сайті.'
}

function renderMessage(content: string) {
  return content
    .split('\n')
    .map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^(\d+)\.\s/, '<span class="text-accent font-bold mr-1">$1.</span> ')
        .replace(/^[✓•📦📫🏪]/u, '<span class="mr-1">$&</span>')
      return (
        <span
          key={i}
          className={line.startsWith('•') || /^\d\./.test(line) ? 'block' : 'inline'}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    })
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [messages, open])

  function sendMessage(text: string) {
    const q = text.trim()
    if (!q) return

    const userMsg: AIMessage = {
      id: generateId(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const reply = getAIResponse(q)
      const botMsg: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
      setTyping(false)
    }, 800 + Math.random() * 600)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40',
          'size-12 rounded-full bg-accent text-white shadow-lg',
          'flex items-center justify-center',
          'transition-colors duration-200',
          open && 'bg-bg-elevated text-text-primary'
        )}
        aria-label="AI консультант"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={20} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'fixed bottom-36 right-4 md:bottom-24 md:right-6 z-40',
              'w-[calc(100vw-2rem)] max-w-sm',
              'glass border border-border/70 rounded-lg shadow-xl',
              'flex flex-col',
              'max-h-[70vh] h-[480px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <div className="size-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">AI Консультант</p>
                <p className="text-[11px] text-success flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-success inline-block" />
                  Онлайн
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="size-6 rounded-full bg-accent flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-bg-elevated text-text-primary border border-border rounded-bl-sm'
                    )}
                  >
                    {msg.role === 'assistant'
                      ? renderMessage(msg.content)
                      : msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="size-6 rounded-full bg-accent flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-bg-elevated border border-border px-3 py-2.5 rounded-lg rounded-bl-sm">
                    <div className="flex gap-1 items-center h-3">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="size-1.5 rounded-full bg-text-muted"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-2.5 py-1 bg-bg-elevated border border-border rounded-full text-text-secondary hover:border-border-light hover:text-text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-border">
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Запитайте про товар…"
                  disabled={typing}
                  className={cn(
                    'flex-1 h-9 bg-bg-elevated border border-border rounded',
                    'text-sm text-text-primary placeholder:text-text-muted px-3',
                    'focus:outline-none focus:border-accent',
                    'disabled:opacity-50'
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className={cn(
                    'size-9 rounded bg-accent text-white flex items-center justify-center',
                    'hover:bg-accent-hover transition-colors',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
