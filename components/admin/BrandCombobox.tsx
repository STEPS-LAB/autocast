'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'

interface BrandComboboxProps {
  brands: Brand[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
}

export default function BrandCombobox({
  brands,
  value,
  onChange,
  placeholder = 'Почніть вводити назву бренду…',
  disabled = false,
  className,
  inputClassName,
}: BrandComboboxProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) {
      return brands.slice(0, 12)
    }
    const starts = brands.filter(b => b.name.toLowerCase().startsWith(q))
    const rest = brands.filter(
      b => !b.name.toLowerCase().startsWith(q) && b.name.toLowerCase().includes(q)
    )
    return [...starts, ...rest].slice(0, 12)
  }, [brands, value])

  const hasExact = useMemo(
    () => brands.some(b => b.name.toLowerCase() === value.trim().toLowerCase()),
    [brands, value]
  )

  useEffect(() => {
    setHighlight(0)
  }, [value, open])

  useEffect(() => {
    function onDocPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocPointerDown)
    return () => document.removeEventListener('mousedown', onDocPointerDown)
  }, [])

  function selectBrand(b: Brand) {
    onChange(b.name)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && filtered.length > 0) {
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      const b = filtered[highlight]
      if (b) {
        e.preventDefault()
        selectBrand(b)
      }
    }
  }

  const showList = open && !disabled && filtered.length > 0
  const showEmptyHint = open && !disabled && value.trim().length > 0 && filtered.length === 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted',
          inputClassName
        )}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded border border-border bg-bg-surface py-1 shadow-lg"
        >
          {filtered.map((b, i) => (
            <li key={b.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectBrand(b)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  i === highlight
                    ? 'bg-accent/20 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}
              >
                {b.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showEmptyHint && (
        <p className="absolute z-50 mt-1 w-full rounded border border-border bg-bg-surface px-3 py-2 text-xs text-text-muted shadow-lg">
          Немає збігів. Після збереження товару бренд «{value.trim()}» буде додано в каталог.
        </p>
      )}
      {value.trim() && !hasExact && filtered.length > 0 && (
        <p className="mt-1 text-xs text-text-muted">
          Можна обрати зі списку або залишити свій текст — новий бренд збережеться в базі.
        </p>
      )}
    </div>
  )
}
