'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Input from '@/components/ui/Input'
import UkrainePhoneInput, { isUkrainePhoneComplete } from '@/components/ui/UkrainePhoneInput'
import Button from '@/components/ui/Button'

const leadSchema = z.object({
  name: z.string().min(2, 'Введіть імʼя'),
  phone: z
    .string()
    .refine(value => isUkrainePhoneComplete(value), 'Введіть повний номер телефону'),
  email: z.string().email('Некоректний email').optional().or(z.literal('')),
})

type LeadInput = z.infer<typeof leadSchema>

const ctaInputClass =
  'h-11 rounded-lg bg-bg-input border-border text-text-primary font-medium placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none antialiased'

export default function HomeUltimateCta() {
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { email: '', phone: '' },
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
      className="scroll-mt-20 md:scroll-mt-28 relative overflow-hidden bg-bg-primary border-t border-border py-20 md:py-32 lg:py-40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgb(255_193_7/0.08),transparent_60%)]" aria-hidden />

      <div className="container-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center"
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

          <div
            data-contact-form
            className="rounded-xl border border-border bg-bg-surface p-6 md:p-8 shadow-[0_24px_64px_-28px_rgb(15_23_42/0.12)] antialiased max-md:scroll-mt-20"
          >
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
                  className={ctaInputClass}
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
                    <UkrainePhoneInput
                      label="Телефон"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.phone?.message}
                      className={ctaInputClass}
                    />
                  )}
                />
                <Input
                  label="Email (необовʼязково)"
                  type="email"
                  placeholder="ivan@example.com"
                  error={errors.email?.message}
                  className={ctaInputClass}
                  {...register('email')}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  className="gap-2 mt-2 transition-transform duration-500 hover:scale-[1.02] max-md:h-auto max-md:min-h-[3.5rem] max-md:py-4 max-md:px-5 max-md:text-[15px] max-md:leading-snug max-md:whitespace-normal"
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
