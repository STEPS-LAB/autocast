import { NextResponse } from 'next/server'
import { getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function GET() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? null

  return NextResponse.json({
    ok: Boolean(supabaseUrl && supabaseAnonKey),
    env: {
      hasNextPublicSupabaseUrl: Boolean(process.env['NEXT_PUBLIC_SUPABASE_URL']),
      hasSupabaseUrl: Boolean(process.env['SUPABASE_URL']),
      hasNextPublicSupabaseAnonKey: Boolean(process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']),
      hasSupabaseAnonKey: Boolean(process.env['SUPABASE_ANON_KEY']),
      hasSupabaseServiceRoleKey: Boolean(serviceRoleKey),
      siteUrl: getSiteUrl(),
      vercelEnv: process.env['VERCEL_ENV'] ?? null,
      vercelUrl: process.env['VERCEL_URL'] ?? null,
    },
  })
}
