import { NextResponse } from 'next/server'
import { getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

function mask(value: string | null) {
  if (!value) return null
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

export async function GET() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? null

  return NextResponse.json(
    {
      ok: Boolean(supabaseUrl && supabaseAnonKey),
      resolved: {
        siteUrl: getSiteUrl(),
        supabaseUrl: mask(supabaseUrl),
        supabaseAnonKey: mask(supabaseAnonKey),
        supabaseServiceRoleKey: mask(serviceRoleKey),
      },
      sources: {
        NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env['NEXT_PUBLIC_SUPABASE_URL']),
        SUPABASE_URL: Boolean(process.env['SUPABASE_URL']),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']),
        SUPABASE_ANON_KEY: Boolean(process.env['SUPABASE_ANON_KEY']),
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']),
        SUPABASE_PUBLISHABLE_KEY: Boolean(process.env['SUPABASE_PUBLISHABLE_KEY']),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env['SUPABASE_SERVICE_ROLE_KEY']),
        NEXT_PUBLIC_SITE_URL: Boolean(process.env['NEXT_PUBLIC_SITE_URL']),
        SITE_URL: Boolean(process.env['SITE_URL']),
        VERCEL_PROJECT_PRODUCTION_URL: Boolean(process.env['VERCEL_PROJECT_PRODUCTION_URL']),
        VERCEL_URL: Boolean(process.env['VERCEL_URL']),
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
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
