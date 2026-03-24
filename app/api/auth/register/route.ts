import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некоректні дані реєстрації' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase не налаштований на сервері' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { email, password } = parsed.data

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не вдалося створити акаунт' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Щось пішло не так. Спробуйте ще раз.' },
      { status: 500 }
    )
  }
}
