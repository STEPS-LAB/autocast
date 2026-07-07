'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const leadSchema = z.object({
  name: z.string().min(2, 'Введіть імʼя'),
  phone: z
    .string()
    .min(9, 'Введіть номер телефону')
    .refine(value => /^\d{9}$/.test(value), 'Некоректний номер'),
  email: z.string().email('Некоректний email').optional().or(z.literal('')),
})

type LeadInput = z.infer<typeof leadSchema>

function extractPhoneDigits(value: string) {
  const onlyDigits = value.replace(/\D/g, '')
  const withoutCountry = onlyDigits.startsWith('380') ? onlyDigits.slice(3) : onlyDigits
  const withoutLeadingZero = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry
  return withoutLeadingZero.slice(0, 9)
}

function formatPhoneMask(digits: string) {
  if (!digits) return '+38(0'
  let result = '+38(0'
  if (digits.length > 0) result += digits.slice(0, 2)
  if (digits.length >= 2) result += ')'
  if (digits.length > 2) result += `-${digits.slice(2, 5)}`
  if (digits.length > 5) result += `-${digits.slice(5, 7)}`
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`
  return result
}

export default function HomeUltimateCta() {
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: LeadInput) {
    setSubmitError(null)
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email?.trim() || 'lead@autocast.com.ua',
        message: 'Запит з головної сторінки: прошу звʼязатися для індивідуального розрахунку вартості.',
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null
      setSubmitError(payload?.error ?? 'Не вдалось надіслати. Спробуйте ще раз або зателефонуйте нам.')
      return
    }

    setSent(true)
    reset()
  }

  return (
    <section
      id="contact"
      className="scroll-mt-28 relative overflow-hidden bg-bg-primary border-t border-border py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgb(255_193_7/0.08),transparent_60%)]" aria-hidden />

      <div className="container-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-4">Персональний сервіс</p>
            <h2 className="text-headline text-text-primary mb-5">
              Ваш автомобіль заслуговує на досконалість
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              Ваш автомобіль заслуговує світити та звучати бездоганно. Не відкладайте безпеку та власний комфорт на потім.
              Залиште Ваші контакти — наш провідний майстер звʼяжеться з Вами протягом 5 хвилин для індивідуального
              розрахунку вартості, без води та навʼязливих дзвінків.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-bg-surface/90 p-6 md:p-8 shadow-[0_24px_64px_-28px_rgb(15_23_42/0.18)] backdrop-blur-sm">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-4 py-8"
              >
                <div className="size-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">Дякуємо за довіру</h3>
                  <p className="text-sm text-text-secondary">
                    Майстер Autocast звʼяжеться з Вами найближчим часом.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm font-medium text-text-primary mb-2">Залиште контакти для швидкого звʼязку</p>
                <Input
                  label="Ваше імʼя"
                  placeholder="Іван"
                  error={errors.name?.message}
                  {...register('name', {
                    onChange: e => {
                      e.target.value = e.target.value.replace(/\d/g, '')
                    },
                  })}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Телефон"
                      type="text"
                      inputMode="numeric"
                      placeholder="+38(0__)-___-__-__"
                      error={errors.phone?.message}
                      value={formatPhoneMask(field.value ?? '')}
                      onChange={e => {
                        field.onChange(extractPhoneDigits(e.target.value))
                      }}
                    />
                  )}
                />
                <Input
                  label="Email (необовʼязково)"
                  type="email"
                  placeholder="ivan@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  className="gap-2 mt-2 transition-transform duration-300 hover:scale-[1.02]"
                >
                  Отримати розрахунок за 5 хвилин
                  <ArrowRight size={18} />
                </Button>
                {submitError ? (
                  <p className="text-sm text-error">{submitError}</p>
                ) : (
                  <p className="text-xs text-text-muted text-center">
                    Натискаючи кнопку, Ви погоджуєтесь на обробку контактних даних для зворотного звʼязку.
                  </p>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
