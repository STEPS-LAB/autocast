'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { VINResult } from '@/types'

const DEMO_RESULTS: Record<string, VINResult> = {
  WBA3A5C51CF256985: {
    vin: 'WBA3A5C51CF256985',
    make: 'BMW',
    model: '3 Series',
    year: 2012,
    engine: '2.0L 4-cyl Turbo',
    body_type: 'Sedan',
  },
  '1HGCM82633A004352': {
    vin: '1HGCM82633A004352',
    make: 'Honda',
    model: 'Accord',
    year: 2003,
    engine: '2.4L 4-cyl',
    body_type: 'Sedan',
  },
}

export default function VINSearch() {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VINResult | null>(null)
  const [error, setError] = useState('')

  const isValidVIN = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim())

  async function handleSearch() {
    if (!isValidVIN) {
      setError('VIN код має містити рівно 17 символів (літери A-Z крім I, O, Q та цифри 0-9)')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    await new Promise(r => setTimeout(r, 1200))

    const demo = DEMO_RESULTS[vin.toUpperCase()]
    if (demo) {
      setResult(demo)
    } else {
      setResult({
        vin: vin.toUpperCase(),
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        engine: '2.5L 4-cyl',
        body_type: 'Sedan',
      })
    }

    setLoading(false)
  }

  return (
    <section className="py-20">
      <div className="container-xl">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs text-accent uppercase tracking-widest font-medium mb-2">
              Точний підбір
            </p>
            <h2 className="text-headline text-text-primary mb-3">
              Пошук за VIN-кодом
            </h2>
            <p className="text-text-secondary text-sm">
              Введіть VIN вашого автомобіля — ми підберемо точно сумісні товари
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-bg-surface border border-border rounded-md p-6"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={vin}
                  onChange={e => { setVin(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Наприклад: WBA3A5C51CF256985"
                  maxLength={17}
                  className={cn(
                    'w-full h-11 bg-bg-elevated border rounded px-4 font-mono text-sm tracking-widest',
                    'text-text-primary placeholder:text-text-muted placeholder:font-sans placeholder:tracking-normal',
                    'focus:outline-none focus:ring-1 transition-colors uppercase',
                    error
                      ? 'border-error focus:border-error focus:ring-error/20'
                      : 'border-border focus:border-accent focus:ring-accent/20'
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted tabular-nums">
                  {vin.length}/17
                </div>
              </div>
              <Button
                onClick={handleSearch}
                loading={loading}
                disabled={vin.length < 17}
                className="gap-2 shrink-0"
              >
                <Search size={16} />
                Перевірити
              </Button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-error mt-2"
              >
                <AlertCircle size={12} /> {error}
              </motion.p>
            )}

            <p className="text-xs text-text-muted mt-3">
              VIN-код знаходиться на кузові авто, у документах або
              <button className="text-accent hover:underline ml-1">
                дізнайтесь де його знайти
              </button>
            </p>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-bg-elevated border border-success/30 rounded-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="text-sm font-semibold text-success">Автомобіль визначено</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Марка', value: result.make },
                      { label: 'Модель', value: result.model },
                      { label: 'Рік', value: String(result.year) },
                      { label: 'Двигун', value: result.engine },
                      { label: 'Тип кузова', value: result.body_type },
                      { label: 'VIN', value: result.vin.slice(0, 8) + '…' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 flex items-center gap-1.5 text-sm text-accent hover:underline">
                    <ExternalLink size={14} />
                    Знайти сумісні товари для цього авто
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
