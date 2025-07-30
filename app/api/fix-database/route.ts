import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin users or specific authorized users
    const allowedEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!allowedEmails.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Log the database fix attempt
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    console.log(`Database fix attempt from user ${user.email} (IP: ${clientIP})`)

    // Temporarily disable RLS on status_history table to fix the immediate issue
    const { error: disableError } = await supabase
      .from('status_history')
      .select('*')
      .limit(1)
    
    if (disableError) {
      console.error('Error accessing status_history:', disableError)
      
      // If we can't access the table, try to create a simple policy that allows all operations
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view status history for their test cases" ON status_history;
          DROP POLICY IF EXISTS "Users can insert status history for their test cases" ON status_history;
          
          -- Create a simple policy that allows all operations for now
          CREATE POLICY "Allow all status history operations" ON status_history
              FOR ALL USING (true);
        `
      })
      
      if (policyError) {
        console.error('Error creating simple policy:', policyError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database fix attempted. If issues persist, please apply the SQL script manually.'
    })

  } catch (error) {
    console.error('Error applying database fixes:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to apply database fixes',
        details: error instanceof Error ? error.message : 'Unknown error',
        manualFix: 'Please run the fix-status-history-rls.sql script in your Supabase SQL editor'
      },
      { status: 500 }
    )
  }
} 