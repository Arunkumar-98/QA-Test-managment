import { supabase } from './supabase'

/**
 * Handle authentication errors, especially refresh token issues
 */
export const handleAuthError = async (error: any) => {
  console.error('Authentication error:', error)
  
  // Check if it's a refresh token error
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('Refresh Token Not Found') ||
      error?.message?.includes('JWT expired')) {
    
    console.log('Detected refresh token error, clearing session...')
    
    try {
      // Clear the invalid session
      await supabase.auth.signOut()
      
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        
        // Also clear any other potential auth-related storage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('supabase')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
      
      return { success: true, message: 'Session cleared, please sign in again' }
    } catch (clearError) {
      console.error('Error clearing session:', clearError)
      return { success: false, message: 'Failed to clear session' }
    }
  }
  
  return { success: false, message: error?.message || 'Authentication error' }
}

/**
 * Check if the current session is valid
 */
export const isSessionValid = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session validation error:', error)
      return false
    }
    
    return !!session && !!session.user
  } catch (error) {
    console.error('Error checking session validity:', error)
    return false
  }
}

/**
 * Refresh the current session
 */
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Session refresh error:', error)
      return { success: false, error }
    }
    
    return { success: true, session }
  } catch (error) {
    console.error('Error refreshing session:', error)
    return { success: false, error }
  }
}

/**
 * Clear all authentication data
 */
export const clearAllAuthData = async () => {
  try {
    await supabase.auth.signOut()
    
    if (typeof window !== 'undefined') {
      // Clear all Supabase-related storage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('supabase')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage as well
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error clearing auth data:', error)
    return { success: false, error }
  }
} 