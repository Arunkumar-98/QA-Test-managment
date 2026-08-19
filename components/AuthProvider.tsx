"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import {
  LocalSession,
  LocalUser,
  clearSession,
  loadSessionFromSupabase,
  resetPassword as localResetPassword,
  resendSignupEmail,
  setAuthMemory,
  signIn as localSignIn,
  signOutRemote,
  signUp as localSignUp,
  toLocalUser,
  updatePassword,
  verifySignupOtp,
  isEmailConfirmed,
} from '@/lib/local-auth'
import { clearCloudStore, hydrateCloudStore } from '@/lib/local-db'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: LocalUser | null
  session: LocalSession | null
  loading: boolean
  passwordRecovery: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; needsVerification?: boolean }>
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: any; needsVerification?: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string, newPassword?: string) => Promise<{ error: any }>
  resendConfirmation: (email: string) => Promise<{ error: any }>
  verifyEmailCode: (email: string, token: string) => Promise<{ error: any }>
  completePasswordReset: (password: string) => Promise<{ error: any }>
  clearInvalidSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function activateUser(nextUser: LocalUser | null) {
  if (!nextUser) {
    clearCloudStore()
    return
  }
  sessionStorage.removeItem('pendingEmailConfirmation')
  await hydrateCloudStore(nextUser.id)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [session, setSession] = useState<LocalSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const applyUser = async (nextUser: LocalUser | null) => {
    setAuthMemory(nextUser)
    await activateUser(nextUser)
    setUser(nextUser)
    setSession(nextUser ? { user: nextUser } : null)
  }

  const clearInvalidSession = async () => {
    await signOutRemote()
    clearCloudStore()
    setPasswordRecovery(false)
    sessionStorage.removeItem('qa-password-recovery')
    setSession(null)
    setUser(null)
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        if (typeof window !== 'undefined' && sessionStorage.getItem('qa-password-recovery') === '1') {
          setPasswordRecovery(true)
        }
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
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        sessionStorage.setItem('qa-password-recovery', '1')
      }
      if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
        sessionStorage.removeItem('qa-password-recovery')
        void applyUser(null)
        return
      }
      const raw = nextSession?.user ?? null
      if (raw && !isEmailConfirmed(raw) && event !== 'PASSWORD_RECOVERY') {
        void supabase.auth.signOut()
        return
      }
      void applyUser(toLocalUser(raw))
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
    return { error: result.error, needsVerification: result.needsVerification }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const result = await localSignUp(email, password, name)
    return { error: result.error, needsVerification: result.needsVerification }
  }

  const signOut = async () => {
    await clearInvalidSession()
  }

  const resetPassword = async (email: string, newPassword?: string) => {
    return localResetPassword(email, newPassword)
  }

  const resendConfirmation = async (email: string) => {
    return resendSignupEmail(email)
  }

  const verifyEmailCode = async (email: string, token: string) => {
    const result = await verifySignupOtp(email, token)
    if (!result.error && result.user) {
      await applyUser(result.user)
    }
    return { error: result.error }
  }

  const completePasswordReset = async (password: string) => {
    const result = await updatePassword(password)
    if (!result.error) {
      setPasswordRecovery(false)
      sessionStorage.removeItem('qa-password-recovery')
    }
    return result
  }

  const value = {
    user,
    session,
    loading,
    passwordRecovery,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    verifyEmailCode,
    completePasswordReset,
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
