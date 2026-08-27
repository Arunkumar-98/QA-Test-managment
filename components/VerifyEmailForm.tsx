"use client"

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ShieldCheck, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { friendlyAuthError } from '@/lib/auth-errors'

export function VerifyEmailForm({
  email,
  onSwitchToLogin,
}: {
  email: string
  onSwitchToLogin: () => void
}) {
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const { resendConfirmation } = useAuth()
  const { toast } = useToast()

  const handleResend = async () => {
    setError('')
    if (!email.trim()) {
      setError('Missing email address. Go back and sign up again.')
      return
    }
    setIsResending(true)
    try {
      const { error } = await resendConfirmation(email)
      if (error) {
        setError(friendlyAuthError(error.message))
        return
      }
      toast({
        title: 'Email sent',
        description: 'Open the new message and click Confirm email address.',
      })
    } catch {
      setError('Could not resend the email')
    } finally {
      setIsResending(false)
    }
  }

  const handleBack = () => {
    sessionStorage.removeItem('pendingEmailConfirmation')
    onSwitchToLogin()
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">Confirm your email</CardTitle>
        <CardDescription className="text-center text-white/80">
          We emailed <span className="text-white font-medium">{email || 'your inbox'}</span> a{' '}
          <span className="text-white font-medium">Confirm email address</span> link. Open that link to activate
          your account. There is no numeric code in the email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-white/70 text-center">
            After you click the link, come back here and sign in. Check spam if you do not see the email.
          </p>

          <Button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend confirmation email
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors"
            disabled={isResending}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
