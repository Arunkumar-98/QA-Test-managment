"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

const BOOT_TIMEOUT_MS = 4000
const HYDRATE_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      }
    )
  })
}

function isRecoveryMode() {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem('qa-password-recovery') === '1') return true
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset') === '1' || params.get('next') === 'reset') return true
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('type') === 'recovery'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [session, setSession] = useState<LocalSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const hydrateSeq = useRef(0)

  const hydrateInBackground = (nextUser: LocalUser) => {
    const seq = ++hydrateSeq.current
    void withTimeout(hydrateCloudStore(nextUser.id), HYDRATE_TIMEOUT_MS, 'Workspace load')
      .then(() => {
        if (seq !== hydrateSeq.current) return
      })
      .catch((error) => {
        console.error('Could not load workspace data', error)
      })
  }

  const applyUser = async (nextUser: LocalUser | null, options?: { awaitHydrate?: boolean }) => {
    setAuthMemory(nextUser)
    if (!nextUser) {
      hydrateSeq.current += 1
      clearCloudStore()
      setUser(null)
      setSession(null)
      return
    }

    sessionStorage.removeItem('pendingEmailConfirmation')
    setUser(nextUser)
    setSession({ user: nextUser })

    if (options?.awaitHydrate) {
      try {
        await withTimeout(hydrateCloudStore(nextUser.id), HYDRATE_TIMEOUT_MS, 'Workspace load')
      } catch (error) {
        console.error('Could not load workspace data', error)
      }
      return
    }

    hydrateInBackground(nextUser)
  }

  const clearInvalidSession = async () => {
    await signOutRemote()
    clearCloudStore()
    setPasswordRecovery(false)
    sessionStorage.removeItem('qa-password-recovery')
    setSession(null)
    setUser(null)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        if (isRecoveryMode()) {
          setPasswordRecovery(true)
          sessionStorage.setItem('qa-password-recovery', '1')
        }
        const current = await withTimeout(
          loadSessionFromSupabase(),
          BOOT_TIMEOUT_MS,
          'Session restore'
        )
        if (cancelled) return
        // Show login/app immediately; hydrate workspace after.
        setAuthMemory(current)
        setUser(current)
        setSession(current ? { user: current } : null)
        if (current) {
          sessionStorage.removeItem('pendingEmailConfirmation')
          hydrateInBackground(current)
        } else {
          clearCloudStore()
        }
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
      // Defer to avoid known getSession/onAuthStateChange deadlocks.
      window.setTimeout(() => {
        if (event === 'INITIAL_SESSION') return
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryMode())) {
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
        if (raw && !isEmailConfirmed(raw) && event !== 'PASSWORD_RECOVERY' && !isRecoveryMode()) {
          void supabase.auth.signOut()
          return
        }
        void applyUser(toLocalUser(raw))
      }, 0)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await localSignIn(email, password)
    if (!result.error && result.user) {
      await applyUser(result.user, { awaitHydrate: true })
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
      await applyUser(result.user, { awaitHydrate: true })
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
