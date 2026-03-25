'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface CategoryComboboxProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowEmpty?: boolean
  emptyLabel?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
}

export default function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = 'Оберіть категорію…',
  allowEmpty = false,
  emptyLabel = 'Верхній рівень',
  disabled = false,
  className,
  inputClassName,
}: CategoryComboboxProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => categories.find(c => c.id === value) ?? null,
    [categories, value]
  )

  useEffect(() => {
    // Keep the visible text in sync with the selected category when closed.
    if (!open) setQuery(selected?.name_ua ?? '')
  }, [open, selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = categories
    if (!q) return list.slice(0, 20)

    const starts = list.filter(c => c.name_ua.toLowerCase().startsWith(q))
    const rest = list.filter(
      c => !c.name_ua.toLowerCase().startsWith(q) && c.name_ua.toLowerCase().includes(q)
    )
    return [...starts, ...rest].slice(0, 20)
  }, [categories, query])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    function onDocPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocPointerDown)
    return () => document.removeEventListener('mousedown', onDocPointerDown)
  }, [])

  function selectCategory(c: Category) {
    onChange(c.id)
    setQuery(c.name_ua)
    setOpen(false)
  }

  function selectEmpty() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && filtered.length > 0) {
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      // restore selected label
      setQuery(selected?.name_ua ?? '')
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
      const c = filtered[highlight]
      if (c) {
        e.preventDefault()
        selectCategory(c)
      }
    }
  }

  const showList = open && !disabled && filtered.length > 0
  const showEmptyHint = open && !disabled && query.trim().length > 0 && filtered.length === 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full h-10 rounded border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-muted',
          inputClassName
        )}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded border border-border bg-bg-surface py-1 shadow-lg"
        >
          {allowEmpty && (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={selectEmpty}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors border-b border-border',
                  value === ''
                    ? 'bg-accent/20 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}
              >
                {emptyLabel}
              </button>
            </li>
          )}
          {filtered.map((c, i) => (
            <li key={c.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={c.id === value}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCategory(c)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  i === highlight
                    ? 'bg-accent/20 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}
              >
                {c.name_ua}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmptyHint && (
        <p className="absolute z-50 mt-1 w-full rounded border border-border bg-bg-surface px-3 py-2 text-xs text-text-muted shadow-lg">
          Немає збігів. Перевірте список категорій в адмін-панелі.
        </p>
      )}
    </div>
  )
}

