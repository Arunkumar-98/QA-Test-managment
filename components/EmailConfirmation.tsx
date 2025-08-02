"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'

interface EmailConfirmationProps {
  email: string
  onSwitchToLogin: () => void
  onResendEmail: () => void
}

export function EmailConfirmation({ email, onSwitchToLogin, onResendEmail }: EmailConfirmationProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-slate-900">Check your email</CardTitle>
        <CardDescription className="text-center text-slate-600">
          We've sent a confirmation link to <span className="font-medium">{email}</span>
        </CardDescription>
        <div className="text-center text-sm text-slate-500 mt-2">
          Welcome to QA Management! 🎉
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Email sent successfully</h3>
                <p className="text-sm text-green-700 mt-1">
                  Click the link in your email to verify your account and start using QA Management.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What to do next:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the "Confirm your mail" button in the email</li>
              <li>• Return here to sign in to your account</li>
              <li>• Start creating your first project and test cases</li>
            </ul>
          </div>

          {/* Features Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-2">What you'll get:</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Create and manage test cases</li>
              <li>• Share projects with your team</li>
              <li>• Track testing progress and history</li>
              <li>• Collaborate with team members</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onResendEmail}
              variant="outline"
              className="w-full h-11 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend confirmation email
            </Button>
            
            <Button
              onClick={onSwitchToLogin}
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Having trouble? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 