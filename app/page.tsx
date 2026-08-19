"use client"

import { useAuth } from "@/components/AuthProvider"
import { AuthPage } from "@/components/AuthPage"
import { QAApplication } from "@/components/QAApplication"
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm"
import { Loader2 } from "lucide-react"

function AppContent() {
  const { user, loading, passwordRecovery } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Loading...</h2>
          <p className="text-white/80">Please wait while we set up your workspace</p>
        </div>
      </div>
    )
  }

  if (passwordRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <UpdatePasswordForm />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <QAApplication />
}

export default function Home() {
  return <AppContent />
}
