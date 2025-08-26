"use client"

import { AuthProvider, useAuth } from "@/components/AuthProvider"
import { AuthPage } from "@/components/AuthPage"
import { QAApplication } from "@/components/QAApplication"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

function AppContent() {
  const { user, loading, clearInvalidSession } = useAuth()

  // Force clear invalid session if loading takes too long
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(async () => {
        console.log('Loading timeout reached, clearing invalid session...')
        await clearInvalidSession()
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(timeout)
    }
  }, [loading, clearInvalidSession])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Loading...</h2>
          <p className="text-white/80">Please wait while we set up your workspace</p>
          <button 
            onClick={clearInvalidSession}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Clear Session (if stuck)
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <QAApplication />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  )
}
