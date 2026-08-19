import { supabase } from '@/lib/supabase'

export type LocalUser = {
  id: string
  email: string
  user_metadata: {
    name?: string
    full_name?: string
  }
}

export type LocalSession = {
  user: LocalUser
}

let memoryUser: LocalUser | null = null
let memorySession: LocalSession | null = null

function toLocalUser(user: { id: string; email?: string | null; user_metadata?: Record<string, any> } | null): LocalUser | null {
  if (!user?.email) return null
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    },
  }
}

export function setAuthMemory(user: LocalUser | null) {
  memoryUser = user
  memorySession = user ? { user } : null
}

export function getCurrentUser(): LocalUser | null {
  return memoryUser
}

export function getSession(): LocalSession | null {
  return memorySession
}

export function clearSession() {
  memoryUser = null
  memorySession = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('qa-management-auth-token')
    localStorage.removeItem('qa-local-session')
  }
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name, full_name: name },
    },
  })

  if (error) return { error: { message: error.message }, user: null }

  const user = toLocalUser(data.user)
  if (user) setAuthMemory(user)
  return { error: null, user }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) return { error: { message: error.message }, user: null }

  const user = toLocalUser(data.user)
  if (user) setAuthMemory(user)
  return { error: null, user }
}

export async function signOutRemote() {
  await supabase.auth.signOut()
  clearSession()
}

export async function resetPassword(email: string, _newPassword?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/`,
  })
  if (error) return { error: { message: error.message } }
  return { error: null }
}

export async function loadSessionFromSupabase() {
  const { data } = await supabase.auth.getSession()
  const user = toLocalUser(data.session?.user ?? null)
  setAuthMemory(user)
  return user
}

export { toLocalUser }
