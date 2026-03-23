'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'

const contactSchema = z.object({
  name: z.string().min(2, 'Введіть імʼя'),
  email: z.string().email('Некоректний email'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Повідомлення мінімум 10 символів'),
})
type ContactInput = z.infer<typeof contactSchema>

const CONTACT_INFO = [
  { icon: Phone, label: 'Телефон', value: '+38 067 239 1640', href: 'tel:+380672391640' },
  { icon: Mail, label: 'Email', value: 'info@autocast.com.ua', href: 'mailto:info@autocast.com.ua' },
  { icon: MapPin, label: 'Адреса', value: 'Україна, м. Київ', href: undefined },
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
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
          <p className="text-xs text-accent uppercase tracking-widest font-medium mb-3">Зв'язок</p>
          <h1 className="text-headline text-text-primary">Контакти</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact info */}
          <div>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Маєте питання щодо товарів або замовлення?
              Зв'яжіться з нами — ми відповімо протягом кількох годин.
            </p>

            <ul className="space-y-4">
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="size-9 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-text-primary hover:text-accent transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-text-primary">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-bg-surface border border-border rounded-md">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Графік роботи</p>
              <div className="space-y-1 text-sm text-text-secondary">
                <div className="flex justify-between">
                  <span>Пн–Пт</span><span className="text-text-primary">9:00 – 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Сб</span><span className="text-text-primary">10:00 – 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Нд</span><span className="text-text-muted">Вихідний</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-bg-surface border border-border rounded-md p-6">
                <h2 className="text-base font-semibold text-text-primary mb-2">Написати нам</h2>
                <Input
                  label="Імʼя"
                  placeholder="Іван Петренко"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="ivan@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Телефон"
                  type="tel"
                  placeholder="+38 050 000 0000"
                  {...register('phone')}
                />
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                    Повідомлення
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Ваше питання або побажання…"
                    className="w-full bg-bg-elevated border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-xs text-error mt-1">{errors.message.message}</p>
                  )}
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
