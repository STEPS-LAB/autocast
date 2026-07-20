import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'
import { rateLimit } from '@/lib/security/rateLimit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'auth:login', limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase не налаштований на сервері' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()
  const cookieUpdates: Array<{
    name: string
    value: string
    options: Parameters<typeof cookieStore.set>[2]
  }> = []

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
          cookieUpdates.push({ name, value, options })
        })
      },
    },
  })

  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некоректні дані входу' },
        { status: 400 }
      )
    }

    const email = parsed.data.email.trim().toLowerCase()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })

    if (error) {
      const code = 'code' in error ? String(error.code ?? '') : ''
      if (code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
        return NextResponse.json(
          { error: 'Підтвердіть email за посиланням у листі, потім увійдіть знову.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 400 }
      )
    }

    let role: string | undefined
    const userId = authData.user?.id
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      role = profile?.role
    }

    const response = NextResponse.json({ success: true, role })
    cookieUpdates.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  } catch {
    return NextResponse.json(
      { error: 'Щось пішло не так. Спробуйте ще раз.' },
      { status: 500 }
    )
  }
}
