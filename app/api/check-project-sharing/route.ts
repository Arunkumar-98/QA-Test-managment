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

    console.log('🔍 Checking project sharing setup...')

    // Check if project_shares table exists
    const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_shares');" 
    })
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError)
      return NextResponse.json(
        { error: `Failed to check table: ${tableError.message}` },
        { status: 500 }
      )
    }

    const tableExists = tableCheck?.[0]?.exists || false

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        message: 'Project sharing table does not exist',
        tableExists: false,
        action: 'Run setup-project-sharing API to create the table'
      })
    }

    // Check if table has any data
    const { data: rowCount, error: countError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT COUNT(*) as count FROM project_shares;" 
    })
    
    if (countError) {
      console.warn('⚠️ Warning checking row count:', countError.message)
    }

    const count = rowCount?.[0]?.count || 0

    // Check RLS policies
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT policyname FROM pg_policies WHERE tablename = 'project_shares';" 
    })
    
    if (policyError) {
      console.warn('⚠️ Warning checking policies:', policyError.message)
    }

    const policyCount = policies?.length || 0

    console.log('✅ Project sharing check completed!')

    return NextResponse.json({
      success: true,
      message: 'Project sharing is properly set up',
      tableExists: true,
      rowCount: count,
      policyCount: policyCount,
      policies: policies?.map((p: any) => p.policyname) || []
    })

  } catch (error) {
    console.error('❌ Unexpected error in check project sharing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 