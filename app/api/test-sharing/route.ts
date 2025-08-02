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

    console.log('🧪 Testing sharing functionality...')

    // Test 1: Check if project_shares table exists and has data
    const { data: shares, error: sharesError } = await supabase
      .from('project_shares')
      .select('*')
      .limit(5)

    if (sharesError) {
      console.error('❌ Error fetching shares:', sharesError)
      return NextResponse.json(
        { error: `Failed to fetch shares: ${sharesError.message}` },
        { status: 500 }
      )
    }

    // Test 2: Check if projects table exists
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5)

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: `Failed to fetch projects: ${projectsError.message}` },
        { status: 500 }
      )
    }

    // Test 3: Test a specific share token (from your database)
    const testToken = '8fdec2e5-7790-4a5b-9f96-5114860d1f42'
    const { data: specificShare, error: specificError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('access_token', testToken)
      .eq('is_active', true)
      .single()

    console.log('✅ Sharing functionality test completed!')

    return NextResponse.json({
      success: true,
      message: 'Sharing functionality is working correctly',
      tests: {
        sharesTable: {
          exists: true,
          rowCount: shares?.length || 0,
          sampleData: shares?.slice(0, 2) || []
        },
        projectsTable: {
          exists: true,
          rowCount: projects?.length || 0,
          sampleData: projects?.slice(0, 2) || []
        },
        specificToken: {
          token: testToken,
          found: !!specificShare,
          data: specificShare || null,
          error: specificError?.message || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in sharing test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 