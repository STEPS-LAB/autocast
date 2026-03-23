import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  label: string
}

interface CheckoutStepperProps {
  steps: Step[]
  current: number
}

export default function CheckoutStepper({ steps, current }: CheckoutStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = step.id < current
        const isActive = step.id === current
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 relative">
              <div
                className={cn(
                  'size-8 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all',
                  isDone && 'border-success bg-success text-white',
                  isActive && 'border-accent bg-accent text-text-primary',
                  !isDone && !isActive && 'border-border bg-bg-elevated text-text-muted'
                )}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : step.id}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-text-primary' : 'text-text-muted'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-px mx-2 mb-4 transition-colors',
                  isDone ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
