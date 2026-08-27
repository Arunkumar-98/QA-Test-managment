"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import type { EmailOtpType } from '@supabase/supabase-js'

function firstParam(search: URLSearchParams, hash: URLSearchParams, key: string) {
  return search.get(key) || hash.get(key)
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your email…')

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href)
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
      const error = firstParam(url.searchParams, hash, 'error')
      const errorDescription = firstParam(url.searchParams, hash, 'error_description')
      const code = firstParam(url.searchParams, hash, 'code')
      const tokenHash = firstParam(url.searchParams, hash, 'token_hash')
      const token = firstParam(url.searchParams, hash, 'token')
      const type = (firstParam(url.searchParams, hash, 'type') || 'signup') as EmailOtpType
      const next = firstParam(url.searchParams, hash, 'next')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const isRecovery = next === 'reset' || type === 'recovery'

      if (isRecovery) {
        sessionStorage.setItem('qa-password-recovery', '1')
      }

      if (error) {
        setMessage(errorDescription?.replace(/\+/g, ' ') || error)
        return
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (sessionError) {
          setMessage(sessionError.message)
          return
        }
      } else if (tokenHash || token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash || token || '',
          type,
        })
        if (verifyError) {
          setMessage(
            /expired|invalid/i.test(verifyError.message)
              ? 'This link has expired. Go back and request a new confirmation or reset email.'
              : verifyError.message
          )
          return
        }
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setMessage(
            'This confirmation link is outdated. Request a new email, then click Confirm email address again.'
          )
          return
        }
      } else {
        // Implicit flow may already be handled by detectSessionInUrl
        await new Promise((resolve) => setTimeout(resolve, 250))
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          setMessage(
            'This link is missing sign-in details. Request a new email and open it again.'
          )
          return
        }
        if (data.session && (hash.get('type') === 'recovery' || next === 'reset')) {
          sessionStorage.setItem('qa-password-recovery', '1')
        }
      }

      sessionStorage.removeItem('pendingEmailConfirmation')
      window.history.replaceState({}, '', isRecovery ? '/?reset=1' : '/')
      router.replace(isRecovery ? '/?reset=1' : '/')
    }

    void run()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>{message}</p>
        {message !== 'Confirming your email…' && (
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="mt-6 text-sm text-blue-300 hover:text-blue-200"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}
