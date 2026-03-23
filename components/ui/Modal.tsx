'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  'w-full bg-bg-surface border border-border rounded-md shadow-lg',
                  'max-h-[90vh] overflow-y-auto p-6',
                  sizes[size],
                  className
                )}
              >
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-text-primary mb-1">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="text-sm text-text-secondary mb-4">
                    {description}
                  </Dialog.Description>
                )}

                {children}

                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    aria-label="Закрити"
                  >
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
