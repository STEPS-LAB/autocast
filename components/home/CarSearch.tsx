'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Car, ChevronDown, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import { CAR_MAKES, CAR_MODELS } from '@/lib/data/seed'

const YEARS = Array.from({ length: 30 }, (_, i) => 2025 - i)
const ENGINES = ['1.4', '1.6', '2.0', '2.5', '3.0', 'Hybrid', 'EV']

interface SelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
}

function Select({ label, value, onChange, options, disabled, placeholder }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-11 bg-bg-elevated border border-border rounded px-3 pr-8 text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <option value="">{placeholder ?? `Виберіть ${label.toLowerCase()}`}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function CarSearch() {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [engine, setEngine] = useState('')
  const [year, setYear] = useState('')

  const models = make ? (CAR_MODELS[make] ?? []) : []
  const progress = [make, model, engine, year].filter(Boolean).length
  const progressPercent = (progress / 4) * 100
  const selectedMake = CAR_MAKES.find(m => m.id === make)?.name

  function handleSearch() {
    if (!make) return
    const params = new URLSearchParams()
    if (selectedMake) params.set('make', selectedMake)
    if (model) params.set('model', model)
    if (engine) params.set('engine', engine)
    if (year) params.set('year', year)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <section id="car-search" className="py-16 bg-bg-surface border-y border-border">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <Car size={20} className="text-accent" />
            <h2 className="text-headline text-text-primary">Пошук по авто</h2>
          </div>
          <p className="text-text-secondary text-sm">
            Знайдіть запчастини, сумісні з вашим автомобілем
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-bg-elevated border border-border rounded-md p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-widest">Крок {progress}/4</p>
                <p className="text-sm text-text-secondary">Вкажіть параметри авто для точного підбору</p>
              </div>
              <div className="w-36 h-2 rounded-full bg-bg-primary overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                  <Select
                    label="Марка"
                    value={make}
                    onChange={v => {
                      setMake(v)
                      setModel('')
                    }}
                    options={CAR_MAKES.map(m => ({ value: m.id, label: m.name }))}
                    placeholder="Виберіть марку"
                  />
                  <Select
                    label="Модель"
                    value={model}
                    onChange={setModel}
                    options={models.map(m => ({ value: m, label: m }))}
                    disabled={!make}
                    placeholder="Виберіть модель"
                  />
                  <Select
                    label="Двигун"
                    value={engine}
                    onChange={setEngine}
                    options={ENGINES.map(item => ({ value: item, label: item }))}
                    placeholder="Виберіть двигун"
                  />
                  <Select
                    label="Рік"
                    value={year}
                    onChange={setYear}
                    options={YEARS.map(y => ({ value: String(y), label: String(y) }))}
                    placeholder="Виберіть рік"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={!make}
                  fullWidth
                  size="lg"
                  className="gap-2 micro-pop"
                >
                  <Search size={18} />
                  Знайти запчастини
                </Button>
              </div>

              <div className="relative rounded-md overflow-hidden border border-border bg-bg-surface min-h-48">
                <Image
                  src={
                    selectedMake
                      ? 'https://images.unsplash.com/photo-1617814065893-00757125efec?w=900&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80'
                  }
                  alt="Підбір по авто"
                  fill
                  sizes="(max-width: 1024px) 100vw, 280px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-accent uppercase tracking-widest mb-1">Вибране авто</p>
                  <p className="text-sm text-white font-semibold">
                    {selectedMake ?? 'Оберіть марку'} {model ? `• ${model}` : ''}
                  </p>
                  <p className="text-xs text-white/75 mt-0.5">
                    {engine || 'Двигун не вибрано'} {year ? `• ${year}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
