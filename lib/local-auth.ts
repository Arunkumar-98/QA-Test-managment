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

function redirectBase() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://qa-test-managment.vercel.app'
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
      emailRedirectTo: `${redirectBase()}/auth/callback`,
    },
  })

  if (error) return { error: { message: error.message }, user: null, needsVerification: false }

  if (data.user && !data.session && (data.user.identities?.length ?? 0) === 0) {
    return {
      error: { message: 'An account with this email already exists. Sign in, or reset your password.' },
      user: null,
      needsVerification: false,
    }
  }

  if (!data.session) {
    return { error: null, user: null, needsVerification: true }
  }

  const user = toLocalUser(data.user)
  if (user) setAuthMemory(user)
  return { error: null, user, needsVerification: false }
}

export async function verifySignupOtp(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedToken = token.trim()

  const signup = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: 'signup',
  })

  const result = signup.error
    ? await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedToken,
        type: 'email',
      })
    : signup

  if (result.error) return { error: { message: result.error.message }, user: null }
  const user = toLocalUser(result.data.user)
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
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${redirectBase()}/auth/callback?next=reset`,
  })
  if (error) return { error: { message: error.message } }
  return { error: null }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: { message: error.message } }
  return { error: null }
}

export async function resendSignupEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: `${redirectBase()}/auth/callback` },
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
