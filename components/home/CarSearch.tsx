'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Car, ChevronDown, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import { CAR_MAKES, CAR_MODELS } from '@/lib/data/seed'

const YEARS = Array.from({ length: 30 }, (_, i) => 2025 - i)

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
  const [year, setYear] = useState('')

  const models = make ? (CAR_MODELS[make] ?? []) : []

  function handleSearch() {
    if (!make) return
    const params = new URLSearchParams()
    const makeName = CAR_MAKES.find(m => m.id === make)?.name
    if (makeName) params.set('make', makeName)
    if (model) params.set('model', model)
    if (year) params.set('year', year)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <section className="py-16 bg-bg-surface border-y border-border">
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
          className="max-w-3xl mx-auto"
        >
          <div className="bg-bg-elevated border border-border rounded-md p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Select
                label="Марка"
                value={make}
                onChange={v => { setMake(v); setModel('') }}
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
              className="gap-2"
            >
              <Search size={18} />
              Знайти запчастини
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
