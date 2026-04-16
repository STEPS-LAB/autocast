import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'
import { rateLimit } from '@/lib/security/rateLimit'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, { bucket: 'auth:forgot-password', limit: 3, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некоректний email' },
        { status: 400 },
      )
    }

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase не налаштований на сервері' },
        { status: 500 },
      )
    }

    const requestOrigin = new URL(request.url).origin
    const siteUrl = requestOrigin || getSiteUrl()

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Щось пішло не так. Спробуйте ще раз.' },
      { status: 500 },
    )
  }
}
