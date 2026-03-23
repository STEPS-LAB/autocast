'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'

const registerSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Паролі не співпадають',
  path: ['confirmPassword'],
})

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) {
        setError(authError.message)
        return
      }
      setSuccess(true)
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="size-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Перевірте email</h2>
            <p className="text-sm text-text-secondary">
              Ми надіслали посилання для підтвердження реєстрації на вашу адресу.
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
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="flex items-center justify-center size-9 bg-accent rounded text-text-primary">
              <Zap size={18} strokeWidth={2.5} />
            </span>
            <span className="font-bold text-xl text-text-primary">
              AUTO<span className="text-accent">CAST</span>
            </span>
          </div>

          <div className="bg-bg-surface border border-border rounded-md p-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Реєстрація</h1>
            <p className="text-sm text-text-muted mb-6">
              Вже є акаунт?{' '}
              <Link href="/login" className="text-accent hover:underline">
                Увійти
              </Link>
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
              <Input
                label="Пароль"
                type="password"
                placeholder="Мінімум 8 символів"
                leftIcon={<Lock size={14} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Повторіть пароль"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {error && (
                <p className="text-sm text-error bg-error/10 border border-error/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Зареєструватися
              </Button>
            </form>

            <p className="text-xs text-text-muted mt-4 text-center">
              Реєструючись, ви погоджуєтесь з{' '}
              <span className="text-accent cursor-pointer hover:underline">
                умовами використання
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
