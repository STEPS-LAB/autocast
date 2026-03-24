'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { CarMake } from '@/types'

const YEARS = Array.from({ length: 30 }, (_, i) => 2025 - i)
const ENGINES = ['1.4', '1.6', '2.0', '2.5', '3.0', 'Hybrid', 'EV']

interface SelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
  searchable = false,
  searchPlaceholder,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(o => o.value === value)

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, search])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  return (
    <div ref={containerRef} className="flex flex-col gap-1 relative">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full h-11 bg-bg-surface border border-border rounded px-3 pr-8 text-sm text-left text-text-primary',
          'focus:outline-none focus:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
          open && 'border-accent'
        )}
      >
        <span className={cn(!selectedOption && 'text-text-muted')}>
          {selectedOption?.label ?? placeholder ?? `Виберіть ${label.toLowerCase()}`}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'absolute right-3 top-[calc(50%+11px)] -translate-y-1/2 text-text-muted pointer-events-none transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-border bg-bg-surface shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={searchPlaceholder ?? `Пошук: ${label.toLowerCase()}`}
                  className="w-full h-9 rounded border border-border bg-bg-surface pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-text-muted">Нічого не знайдено</p>
            )}
            {filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors',
                  'hover:bg-bg-elevated',
                  value === option.value && 'text-accent'
                )}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CarSearchProps {
  makes: CarMake[]
  modelsByMake: Record<string, string[]>
}

export default function CarSearch({ makes, modelsByMake }: CarSearchProps) {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [engine, setEngine] = useState('')
  const [year, setYear] = useState('')

  const models = make ? (modelsByMake[make] ?? []) : []
  const progress = [make, model, engine, year].filter(Boolean).length
  const progressPercent = (progress / 4) * 100
  const selectedMake = makes.find(m => m.id === make)?.name

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
          <div className="mb-3">
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

            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                <Select
                  label="Марка"
                  value={make}
                  onChange={v => {
                    setMake(v)
                    setModel('')
                  }}
                  options={makes.map(m => ({ value: m.id, label: m.name }))}
                  placeholder="Виберіть марку"
                  searchable
                  searchPlaceholder="Пошук марки..."
                />
                <Select
                  label="Модель"
                  value={model}
                  onChange={setModel}
                  options={models.map(m => ({ value: m, label: m }))}
                  disabled={!make}
                  placeholder="Виберіть модель"
                  searchable
                  searchPlaceholder="Пошук моделі..."
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
                  searchable
                  searchPlaceholder="Пошук року..."
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}
