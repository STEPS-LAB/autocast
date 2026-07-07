'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'
import SiteLogo from '@/components/layout/SiteLogo'

const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Мінімум 6 символів'),
})

type LoginInput = z.infer<typeof loginSchema>

function resolvePostLoginPath(role: string | undefined, next: string | null): string {
  if (role === 'admin') return '/admin'
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
    return next.split('?')[0] ?? next
  }
  return '/account'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const email = data.email.trim().toLowerCase()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      })
      if (authError) {
        const code = 'code' in authError ? String(authError.code ?? '') : ''
        if (code === 'email_not_confirmed' || /email not confirmed/i.test(authError.message)) {
          setError('Підтвердіть email за посиланням у листі, потім увійдіть знову.')
        } else if (
          code === 'invalid_credentials' ||
          /invalid login credentials/i.test(authError.message)
        ) {
          setError('Невірний email або пароль')
        } else {
          setError(authError.message || 'Невірний email або пароль')
        }
        return
      }

      const userId = authData.user?.id
      let role: string | undefined
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()
        role = profile?.role
      }

      const destination = resolvePostLoginPath(role, searchParams.get('next'))
      router.replace(destination)
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-xl font-bold text-text-primary mb-1">Увійти</h1>
            <p className="text-sm text-text-muted mb-6">
              Новий клієнт?{' '}
              <Link href="/register" className="text-accent hover:underline">
                Зареєструватися
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
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                error={errors.password?.message}
                {...register('password')}
              />

              {error && (
                <p className="text-sm text-error bg-error/10 border border-error/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-xs text-text-muted hover:text-accent transition-colors">
                  Забули пароль?
                </Link>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Увійти
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
