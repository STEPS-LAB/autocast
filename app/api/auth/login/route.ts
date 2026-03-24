import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase не налаштований на сервері' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()
  let response = NextResponse.json({ success: true })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        response = NextResponse.json({ success: true })
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
          response.cookies.set(name, value, options)
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

    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Невірний email або пароль' },
        { status: 400 }
      )
    }

    return response
  } catch {
    return NextResponse.json(
      { error: 'Щось пішло не так. Спробуйте ще раз.' },
      { status: 500 }
    )
  }
}
