import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Only create client if both URL and key are available
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function POST(request: NextRequest) {
  try {
    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Rate limiting: max 3 requests per 10 minutes per email
    const now = Date.now()
    const rateLimitKey = `resend_${email}`
    const rateLimit = rateLimitMap.get(rateLimitKey)

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= 3) {
          const remainingTime = Math.ceil((rateLimit.resetTime - now) / 1000 / 60)
          return NextResponse.json(
            { 
              error: `Too many requests. Please wait ${remainingTime} minutes before trying again.`,
              rateLimited: true,
              remainingTime
            },
            { status: 429 }
          )
        }
        rateLimit.count++
      } else {
        // Reset rate limit
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 10 * 60 * 1000 }) // 10 minutes
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 10 * 60 * 1000 })
    }

    console.log('🔄 API: Attempting to resend confirmation email to:', email)

    // Check if user exists and their confirmation status
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ API: Error checking user status:', userError)
      return NextResponse.json(
        { error: 'Failed to check user status' },
        { status: 500 }
      )
    }

    const user = users?.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ API: User not found:', email)
      return NextResponse.json(
        { error: 'User not found. Please check your email address.' },
        { status: 404 }
      )
    }

    if (user.email_confirmed_at) {
      console.log('⚠️ API: User already confirmed:', email)
      return NextResponse.json(
        { error: 'User is already confirmed. Please try signing in instead.' },
        { status: 400 }
      )
    }

    // Attempt to resend confirmation
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
      },
    })

    if (error) {
      console.error('❌ API: Resend confirmation error:', error)
      
      // Handle specific error cases
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a few minutes before trying again.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('already confirmed') || error.message.includes('user already confirmed')) {
        return NextResponse.json(
          { error: 'User is already confirmed. Please try signing in instead.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to resend confirmation email' },
        { status: 500 }
      )
    }

    console.log('✅ API: Confirmation email resent successfully to:', email)
    
    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      email: email
    })

  } catch (error) {
    console.error('❌ API: Unexpected error in resend confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 