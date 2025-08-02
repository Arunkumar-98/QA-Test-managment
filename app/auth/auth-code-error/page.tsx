"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Mail, RefreshCw, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { toast } from '@/hooks/use-toast'

export default function AuthCodeErrorPage() {
  const [errorDetails, setErrorDetails] = useState<{
    error?: string
    error_code?: string
    error_description?: string
  }>({})
  const [isResending, setIsResending] = useState(false)
  const { resendConfirmation } = useAuth()

  useEffect(() => {
    // Parse URL hash for error details
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const error = params.get('error')
      const error_code = params.get('error_code')
      const error_description = params.get('error_description')
      
      setErrorDetails({
        error: error || undefined,
        error_code: error_code || undefined,
        error_description: error_description ? decodeURIComponent(error_description) : undefined
      })
    }
  }, [])

  const handleResendConfirmation = async () => {
    setIsResending(true)
    try {
      // Get email from localStorage or prompt user
      const email = localStorage.getItem('pendingEmailConfirmation')
      let userEmail = email
      
      if (!userEmail) {
        // Prompt user for email
        userEmail = prompt("Please enter your email address to resend the confirmation:")
        if (!userEmail) {
          setIsResending(false)
          return
        }
      }

      // Try the new API route first for better error handling
      try {
        const response = await fetch('/api/resend-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to resend confirmation email')
        }
      } catch (apiError) {
        console.log('API route failed, falling back to client method:', apiError)
        
        // Fallback to original method
        const { error } = await resendConfirmation(userEmail)
        if (error) {
          throw new Error(error.message || 'Failed to resend confirmation email')
        }
      }

      toast({
        title: "Email sent!",
        description: "A new confirmation email has been sent to your inbox.",
      })
      
      // Store the email for future use
      localStorage.setItem('pendingEmailConfirmation', userEmail)
      
    } catch (error) {
      console.error('Resend confirmation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend confirmation email'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const getErrorMessage = () => {
    if (errorDetails.error_code === 'otp_expired') {
      return "Email link has expired"
    }
    if (errorDetails.error === 'access_denied') {
      return "Access denied - link is invalid"
    }
    return "Link expired or invalid"
  }

  const getErrorDescription = () => {
    if (errorDetails.error_description) {
      return errorDetails.error_description
    }
    return "The authentication link you clicked may have expired or is invalid. Please try signing in again."
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
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-900">Authentication Error</CardTitle>
            <CardDescription className="text-center text-slate-600">
              {errorDetails.error_code === 'otp_expired' 
                ? 'Your email confirmation link has expired'
                : 'There was an issue with your authentication link'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Error Message */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">{getErrorMessage()}</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {getErrorDescription()}
                    </p>
                    {errorDetails.error_code && (
                      <p className="text-xs text-orange-600 mt-2">
                        Error code: {errorDetails.error_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">What you can do:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Try signing in with your email and password</li>
                  <li>• Request a new confirmation email below</li>
                  <li>• Check your email inbox and spam folder</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              {/* Quick Fix for Expired Links */}
              {errorDetails.error_code === 'otp_expired' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <RefreshCw className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Quick Fix</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Email links expire for security. Click "Request new link" below to get a fresh confirmation email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Link>
                </Button>
                
                <Button 
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  variant="outline" 
                  className="w-full h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Request new link
                    </>
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Need help? Contact our support team for assistance.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                  <span>Error: {errorDetails.error || 'unknown'}</span>
                  {errorDetails.error_code && (
                    <span>Code: {errorDetails.error_code}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 