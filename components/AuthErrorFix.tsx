"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, LogOut, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface AuthErrorFixProps {
  error?: string
  onFixed?: () => void
}

export function AuthErrorFix({ error, onFixed }: AuthErrorFixProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { clearInvalidSession } = useAuth()

  const handleClearSession = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await clearInvalidSession()
      setMessage('Session cleared successfully! Please sign in again.')
      onFixed?.()
    } catch (err) {
      setMessage('Failed to clear session. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await clearInvalidSession()
      setMessage('Session cleared. Please sign in again.')
      onFixed?.()
    } catch (err) {
      setMessage('Failed to refresh session. Please try clearing the session instead.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckSession = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const hasSession = typeof window !== 'undefined' && !!localStorage.getItem('qa-local-session')
      setMessage(hasSession ? 'Session is valid! You should be able to continue.' : 'No active session found. Please sign in.')
      if (hasSession) onFixed?.()
    } catch (err) {
      setMessage('Failed to check session status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-slate-900">
          Authentication Error
        </CardTitle>
        <CardDescription className="text-center text-slate-600">
          {error || 'There was an issue with your authentication session'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('successfully') || message.includes('valid')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-orange-50 border border-orange-200 text-orange-800'
            }`}>
              <div className="flex items-center space-x-2">
                {message.includes('successfully') || message.includes('valid') ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>{message}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckSession}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Session Status
            </Button>

            <Button
              onClick={handleRefreshSession}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Session
            </Button>

            <Button
              onClick={handleClearSession}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Clear Session & Sign Out
            </Button>
          </div>

          <div className="text-xs text-slate-500 text-center mt-4">
            If the issue persists, try refreshing the page or clearing your browser cache.
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 