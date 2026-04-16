'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, CheckCircle } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'
import SiteLogo from '@/components/layout/SiteLogo'

const schema = z.object({
  password: z.string().min(8, 'Мінімум 8 символів'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Паролі не співпадають',
  path: ['confirmPassword'],
})

type FormInput = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormInput) {
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        if (/same.*password/i.test(updateError.message)) {
          setError('Новий пароль має відрізнятися від поточного')
        } else {
          setError(updateError.message || 'Не вдалося оновити пароль')
        }
        return
      }

      setDone(true)
      setTimeout(() => {
        router.push('/account')
        router.refresh()
      }, 2000)
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="size-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Пароль оновлено</h2>
            <p className="text-sm text-text-secondary">
              Ваш пароль успішно змінено. Перенаправляємо до акаунту...
            </p>
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
            <h1 className="text-xl font-bold text-text-primary mb-1">Новий пароль</h1>
            <p className="text-sm text-text-muted mb-6">
              Введіть новий пароль для вашого акаунту.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Новий пароль"
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
                Зберегти пароль
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                Повернутися до входу
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
