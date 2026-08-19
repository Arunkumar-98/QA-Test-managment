import { clearSession, getSession, signOutRemote } from '@/lib/local-auth'
import { clearCloudStore } from '@/lib/local-db'

export const handleAuthError = async (error: any) => {
  console.error('Authentication error:', error)
  await clearAllAuthData()
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
  return { success: true, message: 'Session cleared, please sign in again' }
}

export const isSessionValid = async () => {
  return !!getSession()?.user
}

export const refreshSession = async () => {
  const session = getSession()
  if (!session) return { success: false, error: { message: 'No session' } }
  return { success: true, session }
}

export const clearAllAuthData = async () => {
  await signOutRemote()
  clearCloudStore()
  clearSession()
  return { success: true }
}
