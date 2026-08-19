"use client"

import { useEffect, useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { VerifyEmailForm } from './VerifyEmailForm'
import { ThemeToggle } from './ThemeToggle'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email'

export function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [pendingEmail, setPendingEmail] = useState('')

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingEmailConfirmation')
    if (pending) {
      setPendingEmail(pending)
      setAuthMode('verify-email')
    }
  }, [])

  const renderAuthForm = () => {
    switch (authMode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToSignup={() => setAuthMode('signup')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
            onNeedVerification={(email) => {
              setPendingEmail(email)
              setAuthMode('verify-email')
            }}
          />
        )
      case 'signup':
        return (
          <SignupForm
            onSwitchToLogin={() => setAuthMode('login')}
            onSignupSuccess={(email) => {
              setPendingEmail(email)
              setAuthMode('verify-email')
            }}
          />
        )
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )
      case 'verify-email':
        return (
          <VerifyEmailForm
            email={pendingEmail}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle className="bg-white/10 hover:bg-white/20" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img
              src="/favicon.png"
              alt="QA Management"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                if (target.src.includes('favicon.png')) {
                  target.src = '/favicon.ico'
                }
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">QA Management</h1>
          <p className="text-white/80 text-lg">Professional test case management for teams</p>
        </div>

        {renderAuthForm()}

        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">We’ll email a confirmation link so only you can activate the account</p>
        </div>
      </div>
    </div>
  )
}
