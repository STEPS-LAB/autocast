import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey } from './env'

/**
 * Cookieless Supabase client for public read-only queries.
 * Safe to use inside unstable_cache / 'use cache' where cookies() is forbidden.
 */
export function createStaticClient() {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createSupabaseClient(url, anonKey)
}
