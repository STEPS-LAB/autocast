'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ServiceFaq } from '@/lib/data/services'
import { cn } from '@/lib/utils'

export default function ServiceFaqAccordion({ faqs }: { faqs: ServiceFaq[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {faqs.map(f => (
        <FaqItem key={f.q} item={f} />
      ))}
    </div>
  )
}

function FaqItem({ item }: { item: ServiceFaq }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-bg-surface/90 backdrop-blur-md shadow-sm',
        'transition-[box-shadow,border-color] duration-300 ease-out',
        'hover:border-border-light hover:shadow-md',
        open && 'border-accent/35 shadow-[0_8px_32px_-12px_rgb(15_23_42/0.12)] ring-1 ring-accent/15'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left md:px-5 md:py-4',
          'text-sm font-semibold text-text-primary transition-colors duration-200',
          'hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl'
        )}
      >
        <span className="pr-2">{item.q}</span>
        <ChevronDown
          size={18}
          className={cn(
            'shrink-0 text-text-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            open && 'rotate-180 text-accent'
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="border-t border-border/60 px-4 pb-4 pt-3 text-sm leading-relaxed text-text-secondary md:px-5 md:pb-5">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  )
}
