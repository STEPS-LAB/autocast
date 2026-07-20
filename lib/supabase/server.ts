import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseAnonKey } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore — called from Server Component
          }
        },
      },
    }
  )
}

/**
 * Service-role client that bypasses RLS.
 * Must use @supabase/supabase-js (not createServerClient): SSR cookie sessions
 * replace the Authorization header and silently enforce RLS again.
 */
export function createServiceClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role environment variables are not configured')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
