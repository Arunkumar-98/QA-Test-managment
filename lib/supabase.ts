import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tbutffculjesqiodwxsh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvIS'

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