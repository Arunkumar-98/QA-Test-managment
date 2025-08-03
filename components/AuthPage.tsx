"use client"

import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'


type AuthMode = 'login' | 'signup' | 'forgot-password'

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
            onSignupSuccess={(email) => {
              // After successful signup, switch to login
              setAuthMode('login')
            }}
          />
        )
      case 'forgot-password':
        return (
          <ForgotPasswordForm 
            onSwitchToLogin={() => setAuthMode('login')}
            onEmailSent={(email) => {
              // For password reset, we still need email confirmation
              setPendingEmail(email)
              // You can add a simple success message here instead
              alert('Password reset email sent! Please check your inbox.')
              setAuthMode('login')
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img 
              src="/favicon.png" 
              alt="QA Management" 
              className="w-20 h-20 object-contain"
              onError={(e) => {
                // Fallback to favicon.ico if png fails
                const target = e.target as HTMLImageElement;
                if (target.src.includes('favicon.png')) {
                  target.src = '/favicon.ico';
                }
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">QA Management</h1>
          <p className="text-white/80 text-lg">Professional test case management for teams</p>
        </div>

        {/* Auth Form */}
        {renderAuthForm()}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  )
} 