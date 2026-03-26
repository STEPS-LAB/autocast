'use client'

import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Phone, Mail, MapPin, CheckCircle2, Instagram, Facebook } from 'lucide-react'
import { motion } from 'framer-motion'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'

const ADDRESS = 'вулиця Вітрука, 12в, Житомир'
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

const contactSchema = z.object({
  name: z.string().min(2, 'Введіть імʼя'),
  email: z.string().email('Некоректний email'),
  phone: z
    .string()
    .optional()
    .refine(value => !value || value.length === 9, 'Некоректний номер'),
  message: z.string().min(10, 'Повідомлення мінімум 10 символів'),
})
type ContactInput = z.infer<typeof contactSchema>

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

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(data: ContactInput) {
    await new Promise(r => setTimeout(r, 800))
    void data
    setSent(true)
  }

  return (
    <PageTransition>
      <div className="container-xl py-16 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-headline text-text-primary">Контакти</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="md:flex md:flex-col">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Phone size={26} className="text-text-muted" />
                  <h2 className="text-[1.27rem] font-bold text-text-primary">Зателефонуйте нам:</h2>
                </div>
                <p className="text-[0.95rem] text-text-secondary leading-relaxed">
                  Дзвоніть та записуйтесь щоб отримати якісний сервіс
                </p>
                <a
                  href="tel:+380672391640"
                  className="inline-block mt-2 text-[1.52rem] font-bold text-accent hover:opacity-90 transition-opacity"
                >
                  067 239 1640
                </a>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Mail size={26} className="text-text-muted" />
                  <h2 className="text-[1.27rem] font-bold text-text-primary">Напишіть нам:</h2>
                </div>
                <p className="text-[0.95rem] text-text-secondary leading-relaxed">
                  Заповніть форму збоку або напишіть нам на пошту:
                </p>
                <a
                  href="mailto:autocast.com.ua@gmail.com"
                  className="inline-block mt-2 text-[1.27rem] font-bold text-accent hover:opacity-90 transition-opacity"
                >
                  Email: autocast.com.ua@gmail.com
                </a>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MapPin size={26} className="text-text-muted" />
                  <h2 className="text-[1.27rem] font-bold text-text-primary">Наша адреса:</h2>
                </div>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[1.27rem] font-bold text-accent hover:opacity-90 transition-opacity"
                >
                  {ADDRESS}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://www.instagram.com/autocast.com.ua/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.9rem] text-text-primary hover:text-accent transition-colors"
              >
                <Instagram size={29} className="text-accent" />
                Instagram
              </a>
              <a
                href="https://autocast.com.ua/about-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.9rem] text-text-primary hover:text-accent transition-colors"
              >
                <Facebook size={29} className="text-accent" />
                Facebook
              </a>
            </div>

            <div className="mt-8 md:mt-auto p-4 bg-bg-surface border border-border rounded-md">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Графік роботи</p>
              <div className="space-y-1 text-sm text-text-secondary">
                <div className="flex justify-between">
                  <span>Пн–Пт</span><span className="text-text-primary">9:00-19:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Сб</span><span className="text-text-primary">9:00-17:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Нд</span><span className="text-text-muted">Вихідний</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:flex md:flex-col md:justify-end">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-4 py-12"
              >
                <div className="size-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">Повідомлення відправлено</h3>
                  <p className="text-sm text-text-secondary">Ми зв'яжемося з вами найближчим часом</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 bg-bg-surface border border-border rounded-md p-6">
                <h2 className="text-[1.1rem] font-semibold text-text-primary mb-2">Написати нам</h2>
                <Input
                  label="Імʼя"
                  placeholder="Ваше імʼя"
                  className="h-11 text-[0.9625rem]"
                  error={errors.name?.message}
                  hint=" "
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
                      className="h-11 text-[0.9625rem]"
                      error={errors.phone?.message}
                      hint=" "
                      value={formatPhoneMask(field.value ?? '')}
                      onChange={e => {
                        field.onChange(extractPhoneDigits(e.target.value))
                      }}
                      onFocus={e => {
                        const input = e.currentTarget
                        const cursorPosition = (field.value ?? '').length === 0 ? 5 : e.currentTarget.value.length
                        setTimeout(() => {
                          input?.setSelectionRange(cursorPosition, cursorPosition)
                        }, 0)
                      }}
                      onClick={e => {
                        const input = e.currentTarget
                        const cursorPosition = (field.value ?? '').length === 0 ? 5 : e.currentTarget.value.length
                        setTimeout(() => {
                          input?.setSelectionRange(cursorPosition, cursorPosition)
                        }, 0)
                      }}
                      onKeyDown={e => {
                        if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault()
                          const current = field.value ?? ''
                          field.onChange(current.slice(0, -1))
                        }
                      }}
                    />
                  )}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="ivan@example.com"
                  className="h-11 text-[0.9625rem]"
                  error={errors.email?.message}
                  hint=" "
                  {...register('email')}
                />
                <div>
                  <label className="text-[0.9625rem] font-medium text-text-secondary mb-1.5 block">
                    Повідомлення
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Ваше питання або побажання…"
                    className="w-full bg-bg-elevated border border-border rounded px-3 py-2.5 text-[0.9625rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                    {...register('message')}
                  />
                  <p className="text-xs mt-1 min-h-4 text-error">
                    {errors.message?.message ?? ' '}
                  </p>
                </div>
                <Button type="submit" fullWidth loading={isSubmitting}>
                  Надіслати повідомлення
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
