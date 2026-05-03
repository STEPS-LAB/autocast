'use client'

import { useId } from 'react'

/** Декоративні SVG для секцій сторінки послуги. */

export function CornerAccentLines({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M8 8h32M8 8v32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M112 112h-32M112 112v-32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

export function DiagonalStripes({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const patId = `svc-stripes-${uid}`
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern
          id={patId}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patId})`} />
    </svg>
  )
}
