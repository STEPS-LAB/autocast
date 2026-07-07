'use client'

import { forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

const PHONE_MASK_EMPTY = '+38 (___) - ___ - __ - __'
const MAX_UA_PHONE_DIGITS = 9

/** Extract 9 national digits (without leading 0) from any phone string. */
export function extractUkrainePhoneDigits(value: string): string {
  const onlyDigits = value.replace(/\D/g, '')
  const withoutCountry = onlyDigits.startsWith('380') ? onlyDigits.slice(3) : onlyDigits
  const withoutLeadingZero = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry
  return withoutLeadingZero.slice(0, MAX_UA_PHONE_DIGITS)
}

function padSegment(value: string, length: number): string {
  return value + '_'.repeat(Math.max(0, length - value.length))
}

/** Visual mask: +38 (0XX) - XXX - XX - XX with underscores for empty slots. */
export function formatUkrainePhoneMask(digits: string): string {
  const d = digits.slice(0, MAX_UA_PHONE_DIGITS)
  const g1 = d.length > 0 ? padSegment(`0${d.slice(0, 2)}`, 3) : '___'
  const g2 = padSegment(d.slice(2, 5), 3)
  const g3 = padSegment(d.slice(5, 7), 2)
  const g4 = padSegment(d.slice(7, 9), 2)
  return `+38 (${g1}) - ${g2} - ${g3} - ${g4}`
}

export function isUkrainePhoneComplete(digits: string): boolean {
  return digits.length === MAX_UA_PHONE_DIGITS && /^\d{9}$/.test(digits)
}

const NAVIGATION_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Tab',
  'Home',
  'End',
])

function MaskDisplay({ digits }: { digits: string }) {
  const mask = digits.length > 0 ? formatUkrainePhoneMask(digits) : PHONE_MASK_EMPTY

  return (
    <span aria-hidden className="pointer-events-none select-none text-sm font-medium">
      {mask.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={char === '_' ? 'text-white/40 font-normal' : 'text-white'}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

interface UkrainePhoneInputProps {
  id?: string
  label?: string
  value: string
  onChange: (digits: string) => void
  onBlur?: () => void
  error?: string
  className?: string
}

const UkrainePhoneInput = forwardRef<HTMLInputElement, UkrainePhoneInputProps>(
  ({ id, label, value, onChange, onBlur, error, className }, ref) => {
    const digits = extractUkrainePhoneDigits(value)
    const isComplete = isUkrainePhoneComplete(digits)

    const handleChange = useCallback(
      (raw: string) => {
        const next = extractUkrainePhoneDigits(raw)
        if (next.length <= MAX_UA_PHONE_DIGITS) onChange(next)
      },
      [onChange],
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComplete && !NAVIGATION_KEYS.has(event.key) && !event.ctrlKey && !event.metaKey) {
          event.preventDefault()
        }
      },
      [isComplete],
    )

    const handlePaste = useCallback(
      (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        handleChange(event.clipboardData.getData('text'))
      },
      [handleChange],
    )

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3">
            <MaskDisplay digits={digits} />
          </div>
          <input
            ref={ref}
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={digits.length > 0 ? formatUkrainePhoneMask(digits) : ''}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-label={label ?? 'Телефон'}
            className={cn(
              'w-full h-11 rounded-lg border px-3 text-sm font-medium transition-colors duration-150',
              'text-transparent caret-white',
              'focus:outline-none focus:border-[#FFBB00] focus:ring-1 focus:ring-[#FFBB00]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-error focus:border-error focus:ring-error',
              className,
            )}
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  },
)

UkrainePhoneInput.displayName = 'UkrainePhoneInput'
export default UkrainePhoneInput
