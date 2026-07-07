'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const MAX_UA_PHONE_DIGITS = 9

/** Extract 9 national digits (without leading 0) from any phone string. */
export function extractUkrainePhoneDigits(value: string): string {
  const onlyDigits = value.replace(/\D/g, '')
  const withoutCountry = onlyDigits.startsWith('380') ? onlyDigits.slice(3) : onlyDigits
  const withoutLeadingZero = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry
  return withoutLeadingZero.slice(0, MAX_UA_PHONE_DIGITS)
}

/** Single-layer mask: +38 (0XX) - XXX - XX - XX */
export function formatPhoneInputValue(digits: string): string {
  const d = digits.slice(0, MAX_UA_PHONE_DIGITS)
  const op = d.slice(0, 2).padEnd(2, '_')
  const a = d.slice(2, 5).padEnd(3, '_')
  const b = d.slice(5, 7).padEnd(2, '_')
  const c = d.slice(7, 9).padEnd(2, '_')
  return `+38 (0${op}) - ${a} - ${b} - ${c}`
}

export function isUkrainePhoneComplete(digits: string): boolean {
  return digits.length === MAX_UA_PHONE_DIGITS && /^\d{9}$/.test(digits)
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
    const displayValue = formatPhoneInputValue(digits)
    const isComplete = isUkrainePhoneComplete(digits)

    function setDigits(next: string) {
      onChange(next.slice(0, MAX_UA_PHONE_DIGITS))
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (event.key >= '0' && event.key <= '9') {
        if (isComplete) {
          event.preventDefault()
          return
        }
        event.preventDefault()
        setDigits(digits + event.key)
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        if (digits.length > 0) setDigits(digits.slice(0, -1))
      }
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const next = extractUkrainePhoneDigits(event.target.value)
      if (next.length <= MAX_UA_PHONE_DIGITS) onChange(next)
    }

    function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
      event.preventDefault()
      const next = extractUkrainePhoneDigits(event.clipboardData.getData('text'))
      setDigits(next)
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-label={label ?? 'Телефон'}
          className={cn(
            'w-full h-11 rounded-lg border px-3 text-sm font-medium antialiased transition-colors duration-150',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error focus:border-error focus:ring-error/30',
            className,
          )}
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  },
)

UkrainePhoneInput.displayName = 'UkrainePhoneInput'
export default UkrainePhoneInput
