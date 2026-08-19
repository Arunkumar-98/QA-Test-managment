"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Mail, Home } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function VerificationSuccessPage() {
  const [userEmail, setUserEmail] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const email = urlParams.get('email')
    
    if (email) {
      setUserEmail(email)
    } else if (user?.email) {
      setUserEmail(user.email)
    } else {
      const storedEmail = sessionStorage.getItem('pendingEmailConfirmation') || localStorage.getItem('pendingEmailConfirmation')
      if (storedEmail) {
        setUserEmail(storedEmail)
      }
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <img 
              src="/favicon.png" 
              alt="QA Management" 
              className="w-20 h-20 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('favicon.png')) {
                  target.src = '/favicon.ico';
                }
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">QA Management</h1>
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-900">
              Email Verified! 🎉
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Your email address has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Verification Complete</h3>
                    <p className="text-sm text-green-700 mt-1">
                      {userEmail 
                        ? `Your email ${userEmail} has been verified successfully.`
                        : 'Your email has been verified successfully.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">What's next?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You can now sign in to your account</li>
                  <li>• Access all features of QA Management</li>
                  <li>• Create and manage your test cases</li>
                  <li>• Set up your first project</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium">
                  <Link href="/">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Sign in to your account
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go to homepage
                  </Link>
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Having trouble? Contact our support team for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
