"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface EmailVerificationDialogProps {
  isOpen: boolean
  onClose: () => void
  email?: string
}

export function EmailVerificationDialog({ isOpen, onClose, email: initialEmail }: EmailVerificationDialogProps) {
  const [email, setEmail] = useState(initialEmail || '')
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'verified' | 'pending' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
      checkVerificationStatus(initialEmail)
    }
  }, [initialEmail])

  const checkVerificationStatus = async (emailToCheck: string) => {
    if (!emailToCheck) return

    setIsLoading(true)
    setVerificationStatus('checking')
    setError('')

    try {
      const response = await fetch('/api/auth/verify-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check verification status')
        setVerificationStatus('error')
        return
      }

      if (data.email_confirmed) {
        setVerificationStatus('verified')
        toast({
          title: "Email verified! 🎉",
          description: "Your email has been verified. You can now sign in.",
        })
      } else {
        setVerificationStatus('pending')
      }
    } catch (err) {
      console.error('Status check error:', err)
      setError('Failed to check verification status')
      setVerificationStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email')
        return
      }

      toast({
        title: "Verification email sent! 📧",
        description: "Please check your inbox and click the verification link.",
      })

      // Check status after sending
      setTimeout(() => checkVerificationStatus(email), 1000)
    } catch (err) {
      console.error('Resend error:', err)
      setError('Failed to send verification email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkVerificationStatus(email)
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Mail className="w-5 h-5 text-slate-600" />
    }
  }

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'checking':
        return 'Checking verification status...'
      case 'verified':
        return 'Email verified successfully! You can now sign in.'
      case 'pending':
        return 'Email verification pending. Please check your inbox.'
      case 'error':
        return 'Error checking verification status.'
      default:
        return 'Enter your email to check verification status.'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Email Verification</span>
          </DialogTitle>
          <DialogDescription>
            {getStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verificationStatus === 'verified' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-700">
                Your email has been verified! You can now sign in to your account.
              </p>
              <Button onClick={onClose} className="w-full">
                Continue to Sign In
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Status'
                    )}
                  </Button>

                  {verificationStatus === 'pending' && (
                    <Button
                      type="button"
                      onClick={resendVerificationEmail}
                      disabled={isLoading}
                      variant="outline"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Resend
                    </Button>
                  )}
                </div>
              </form>

              {verificationStatus === 'pending' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-700">
                    <strong>Next steps:</strong>
                  </p>
                  <ul className="text-sm text-orange-600 mt-1 space-y-1">
                    <li>• Check your email inbox</li>
                    <li>• Look for an email from QA Management</li>
                    <li>• Click the verification link in the email</li>
                    <li>• Check your spam folder if you don't see it</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
