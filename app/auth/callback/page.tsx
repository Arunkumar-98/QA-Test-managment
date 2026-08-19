"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

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
      const type = firstParam(url.searchParams, hash, 'type')
      const next = firstParam(url.searchParams, hash, 'next')

      if (error) {
        setMessage(errorDescription || error)
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setMessage(exchangeError.message)
          return
        }
      } else if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
        })
        if (verifyError) {
          setMessage(verifyError.message)
          return
        }
      } else {
        await supabase.auth.getSession()
      }

      const isRecovery = next === 'reset' || type === 'recovery'
      if (isRecovery) {
        sessionStorage.setItem('qa-password-recovery', '1')
      }

      router.replace('/')
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
