'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'

const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Мінімум 6 символів'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError) {
        setError('Невірний email або пароль')
        return
      }
      router.push('/account')
      router.refresh()
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
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="font-bold text-xl text-text-primary">
              AUTO<span className="text-accent">CAST</span>
            </span>
          </div>

          <div className="bg-bg-surface border border-border rounded-md p-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Увійти</h1>
            <p className="text-sm text-text-muted mb-6">
              Новий клієнт?{' '}
              <Link href="/register" className="text-accent hover:underline">
                Зареєструватися
              </Link>
            </p>

            {/* Form */}
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
