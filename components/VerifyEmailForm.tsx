"use client"

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function VerifyEmailForm({
  email,
  onSwitchToLogin,
}: {
  email: string
  onSwitchToLogin: () => void
}) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const { verifyEmailCode, resendConfirmation } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const token = code.replace(/\s/g, '')
    if (token.length < 6) {
      setError('Enter the 6-digit code from your email, or click the confirmation link instead')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await verifyEmailCode(email, token)
      if (error) {
        setError(error.message || 'That code is invalid or expired. Use the confirmation link in the email.')
        return
      }
      sessionStorage.removeItem('pendingEmailConfirmation')
      toast({
        title: 'Email verified',
        description: 'Your account is ready.',
      })
    } catch {
      setError('Could not verify that code. Try the confirmation link in your email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setIsResending(true)
    try {
      const { error } = await resendConfirmation(email)
      if (error) {
        setError(error.message)
        return
      }
      toast({
        title: 'Email sent',
        description: 'Check your inbox and spam folder for a new confirmation email.',
      })
    } catch {
      setError('Could not resend the email')
    } finally {
      setIsResending(false)
    }
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
          We sent a confirmation email to <span className="text-white font-medium">{email}</span>. Open it and click{' '}
          <span className="text-white font-medium">Confirm email address</span>. You must use an inbox you own.
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
            After you click the link, this page will sign you in. Check spam if you do not see the email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-white/90">
                Or enter a 6-digit code if your email includes one
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
                  className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder-white tracking-[0.35em] text-center text-lg"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg"
              disabled={isLoading || code.replace(/\s/g, '').length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify with code'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center space-y-3">
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-blue-300 hover:text-blue-200"
            disabled={isResending}
          >
            {isResending ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <div>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
