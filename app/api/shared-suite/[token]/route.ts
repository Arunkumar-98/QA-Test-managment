import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching shared test suite for token:', token)

    // Get share details
    const { data: shareData, error: shareError } = await supabase
      .from('test_suite_shares')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()

    if (shareError) {
      console.error('❌ Error fetching share:', shareError)
      if (shareError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Share link not found or has expired' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch share details' },
        { status: 500 }
      )
    }

    // Check if share is expired
    if (shareData.expires_at && new Date() > new Date(shareData.expires_at)) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Check if max views exceeded
    if (shareData.max_views && shareData.current_views >= shareData.max_views) {
      return NextResponse.json(
        { error: 'Share link has reached its maximum number of views' },
        { status: 429 }
      )
    }

    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', shareData.project_id)
      .single()

    if (projectError || !projectData) {
      console.error('❌ Error fetching project:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get test suite details
    const { data: testSuiteData, error: testSuiteError } = await supabase
      .from('test_suites')
      .select('*')
      .eq('id', shareData.test_suite_id)
      .single()

    if (testSuiteError || !testSuiteData) {
      console.error('❌ Error fetching test suite:', testSuiteError)
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabase
      .from('test_suite_shares')
      .update({ current_views: (shareData.current_views || 0) + 1 })
      .eq('id', shareData.id)

    // Map the data to match the expected format
    const share = {
      id: shareData.id,
      testSuiteId: shareData.test_suite_id,
      testSuiteName: shareData.test_suite_name,
      projectId: shareData.project_id,
      projectName: shareData.project_name,
      accessToken: shareData.access_token,
      permissions: shareData.permissions,
      createdBy: shareData.created_by,
      createdAt: shareData.created_at,
      expiresAt: shareData.expires_at,
      isActive: shareData.is_active,
      allowedEmails: shareData.allowed_emails,
      maxViews: shareData.max_views,
      currentViews: (shareData.current_views || 0) + 1
    }

    const project = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      userId: projectData.user_id,
      createdAt: projectData.created_at
    }

    const testSuite = {
      id: testSuiteData.id,
      name: testSuiteData.name,
      description: testSuiteData.description,
      projectId: testSuiteData.project_id,
      createdAt: testSuiteData.created_at,
      totalTests: testSuiteData.total_tests,
      passedTests: testSuiteData.passed_tests,
      failedTests: testSuiteData.failed_tests,
      pendingTests: testSuiteData.pending_tests
    }

    console.log('✅ Successfully fetched shared test suite')

    return NextResponse.json({
      share,
      project,
      testSuite
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 