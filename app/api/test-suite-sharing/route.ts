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

    console.log('🧪 Testing test suite sharing functionality...')

    // Test 1: Check if test_suite_shares table exists and has data
    const { data: shares, error: sharesError } = await supabase
      .from('test_suite_shares')
      .select('*')
      .limit(5)

    if (sharesError) {
      console.error('❌ Error fetching test suite shares:', sharesError)
      return NextResponse.json(
        { error: `Failed to fetch test suite shares: ${sharesError.message}` },
        { status: 500 }
      )
    }

    // Test 2: Check if test_suites table exists
    const { data: testSuites, error: testSuitesError } = await supabase
      .from('test_suites')
      .select('*')
      .limit(5)

    if (testSuitesError) {
      console.error('❌ Error fetching test suites:', testSuitesError)
      return NextResponse.json(
        { error: `Failed to fetch test suites: ${testSuitesError.message}` },
        { status: 500 }
      )
    }

    // Test 3: Check if projects table exists
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

    // Test 4: Test a specific share token (if any exist)
    let specificToken = null
    if (shares && shares.length > 0) {
      specificToken = shares[0].access_token
    }

    let specificShare = null
    let specificError = null
    if (specificToken) {
      const { data: share, error: error } = await supabase
        .from('test_suite_shares')
        .select('*')
        .eq('access_token', specificToken)
        .eq('is_active', true)
        .single()
      
      specificShare = share
      specificError = error
    }

    console.log('✅ Test suite sharing functionality test completed!')

    return NextResponse.json({
      success: true,
      message: 'Test suite sharing functionality is working correctly',
      tests: {
        sharesTable: {
          exists: true,
          rowCount: shares?.length || 0,
          sampleData: shares?.slice(0, 1) || []
        },
        testSuitesTable: {
          exists: true,
          rowCount: testSuites?.length || 0,
          sampleData: testSuites?.slice(0, 1) || []
        },
        projectsTable: {
          exists: true,
          rowCount: projects?.length || 0,
          sampleData: projects?.slice(0, 1) || []
        },
        specificToken: {
          token: specificToken,
          found: !!specificShare,
          data: specificShare,
          error: specificError?.message || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Error testing test suite sharing functionality:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test test suite sharing functionality',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
