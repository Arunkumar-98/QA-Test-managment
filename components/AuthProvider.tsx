"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import {
  LocalSession,
  LocalUser,
  clearSession,
  loadSessionFromSupabase,
  resetPassword as localResetPassword,
  setAuthMemory,
  signIn as localSignIn,
  signOutRemote,
  signUp as localSignUp,
  toLocalUser,
} from '@/lib/local-auth'
import { clearCloudStore, hydrateCloudStore } from '@/lib/local-db'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: LocalUser | null
  session: LocalSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string, newPassword?: string) => Promise<{ error: any }>
  resendConfirmation: (email: string) => Promise<{ error: any }>
  clearInvalidSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function activateUser(nextUser: LocalUser | null) {
  if (!nextUser) {
    clearCloudStore()
    return
  }
  await hydrateCloudStore(nextUser.id)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [session, setSession] = useState<LocalSession | null>(null)
  const [loading, setLoading] = useState(true)

  const applyUser = async (nextUser: LocalUser | null) => {
    setAuthMemory(nextUser)
    await activateUser(nextUser)
    setUser(nextUser)
    setSession(nextUser ? { user: nextUser } : null)
  }

  const clearInvalidSession = async () => {
    await signOutRemote()
    clearCloudStore()
    setSession(null)
    setUser(null)
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const current = await loadSessionFromSupabase()
        if (cancelled) return
        await applyUser(current)
      } catch (error) {
        console.error('Could not restore session', error)
        if (!cancelled) {
          clearSession()
          clearCloudStore()
          setUser(null)
          setSession(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    boot()

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return
      const nextUser = toLocalUser(nextSession?.user ?? null)
      void applyUser(nextUser)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await localSignIn(email, password)
    if (!result.error && result.user) {
      await applyUser(result.user)
    }
    return { error: result.error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const result = await localSignUp(email, password, name)
    if (!result.error && result.user) {
      await applyUser(result.user)
    }
    return { error: result.error }
  }

  const signOut = async () => {
    await clearInvalidSession()
  }

  const resetPassword = async (email: string, newPassword?: string) => {
    return localResetPassword(email, newPassword)
  }

  const resendConfirmation = async (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${origin}/` },
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    clearInvalidSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
