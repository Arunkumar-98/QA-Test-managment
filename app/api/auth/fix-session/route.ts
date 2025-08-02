import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clearAllAuthData, handleAuthError } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing authentication session...')

    const { action } = await request.json()

    switch (action) {
      case 'clear_session':
        console.log('Clearing all authentication data...')
        const clearResult = await clearAllAuthData()
        
        if (clearResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Authentication session cleared successfully'
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to clear session',
            details: clearResult.error
          }, { status: 500 })
        }

      case 'check_session':
        console.log('Checking current session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          const handleResult = await handleAuthError(error)
          
          return NextResponse.json({
            success: false,
            error: 'Session check failed',
            details: error.message,
            handled: handleResult.success,
            message: handleResult.message
          }, { status: 401 })
        }
        
        return NextResponse.json({
          success: true,
          hasSession: !!session,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at
          } : null
        })

      case 'refresh_session':
        console.log('Refreshing session...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError)
          const handleResult = await handleAuthError(refreshError)
          
          return NextResponse.json({
            success: false,
            error: 'Session refresh failed',
            details: refreshError.message,
            handled: handleResult.success,
            message: handleResult.message
          }, { status: 401 })
        }
        
        return NextResponse.json({
          success: true,
          message: 'Session refreshed successfully',
          user: refreshedSession?.user ? {
            id: refreshedSession.user.id,
            email: refreshedSession.user.email
          } : null
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          validActions: ['clear_session', 'check_session', 'refresh_session']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in auth session fix:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 