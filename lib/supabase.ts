import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Auto refresh tokens
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL
    detectSessionInUrl: true,
    // Flow type for authentication
    flowType: 'pkce',
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    // Storage key to avoid conflicts
    storageKey: 'qa-management-auth-token',
  },
  // Global error handler
  global: {
    headers: {
      'X-Client-Info': 'qa-management-system'
    }
  }
}) 