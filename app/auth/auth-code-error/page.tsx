"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
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
              There was an issue with your authentication link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Error Message */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Link expired or invalid</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      The authentication link you clicked may have expired or is invalid. Please try signing in again.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">What you can do:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Try signing in with your email and password</li>
                  <li>• Request a new password reset if needed</li>
                  <li>• Check your email for a fresh confirmation link</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                  <Link href="/">
                    <Mail className="w-4 h-4 mr-2" />
                    Request new link
                  </Link>
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Need help? Contact our support team for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 