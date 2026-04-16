'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'
import SiteLogo from '@/components/layout/SiteLogo'

const schema = z.object({
  email: z.string().email('Некоректний email'),
})

type FormInput = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormInput) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      })
      const result = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(result.error ?? 'Щось пішло не так. Спробуйте ще раз.')
        return
      }
      setSent(true)
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="size-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Перевірте email</h2>
            <p className="text-sm text-text-secondary">
              Якщо акаунт з такою адресою існує, ми надіслали посилання для скидання пароля.
              Перевірте вхідні та спам.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm text-accent hover:underline">
              Повернутися до входу
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex justify-center mb-8">
            <SiteLogo />
          </div>

          <div className="bg-bg-surface border border-border rounded-md p-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Скидання пароля</h1>
            <p className="text-sm text-text-muted mb-6">
              Введіть email, і ми надішлемо посилання для відновлення пароля.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="ivan@example.com"
                leftIcon={<Mail size={14} />}
                error={errors.email?.message}
                {...register('email')}
              />

              {error && (
                <p className="text-sm text-error bg-error/10 border border-error/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Надіслати посилання
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
              >
                <ArrowLeft size={12} />
                Повернутися до входу
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
