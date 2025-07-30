"use client"

import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { EmailConfirmation } from './EmailConfirmation'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'email-confirmation'

export function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [pendingEmail, setPendingEmail] = useState('')

  const renderAuthForm = () => {
    switch (authMode) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToSignup={() => setAuthMode('signup')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
          />
        )
      case 'signup':
        return (
          <SignupForm 
            onSwitchToLogin={() => setAuthMode('login')}
            onEmailSent={(email) => {
              setPendingEmail(email)
              setAuthMode('email-confirmation')
            }}
          />
        )
      case 'forgot-password':
        return (
          <ForgotPasswordForm 
            onSwitchToLogin={() => setAuthMode('login')}
            onEmailSent={(email) => {
              setPendingEmail(email)
              setAuthMode('email-confirmation')
            }}
          />
        )
      case 'email-confirmation':
        return (
          <EmailConfirmation 
            email={pendingEmail}
            onSwitchToLogin={() => setAuthMode('login')}
            onResendEmail={() => setAuthMode('signup')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">QA Management</h1>
          <p className="text-slate-600 text-lg">Professional test case management for teams</p>
        </div>

        {/* Auth Form */}
        {renderAuthForm()}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  )
} 