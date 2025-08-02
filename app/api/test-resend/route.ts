import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Only create client if both URL and key are available
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(request: NextRequest) {
  try {
    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing resend functionality for:', email)

    // Check if user exists and their confirmation status
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error checking user status:', userError)
      return NextResponse.json(
        { error: 'Failed to check user status', details: userError },
        { status: 500 }
      )
    }

    const user = users?.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          email: email,
          totalUsers: users?.length || 0
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
        emailConfirmedAt: user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        userMetadata: user.user_metadata
      },
      canResend: !user.email_confirmed_at,
      message: user.email_confirmed_at 
        ? 'User is already confirmed - cannot resend' 
        : 'User can receive confirmation email'
    })

  } catch (error) {
    console.error('❌ Unexpected error in test resend:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 