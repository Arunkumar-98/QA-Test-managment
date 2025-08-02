import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Only create client if both URL and key are available
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

    console.log('🔍 Fetching shared project for token:', token)

    // Get share details using service role (bypasses RLS)
    const { data: shareData, error: shareError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()

    if (shareError) {
      console.error('❌ Error fetching share:', shareError)
      if (shareError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Share link is invalid or has expired' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch share details' },
        { status: 500 }
      )
    }

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link is invalid or has expired' },
        { status: 404 }
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
        { status: 410 }
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
        { error: 'The shared project could not be found' },
        { status: 404 }
      )
    }

    // Increment view count
    const { error: incrementError } = await supabase
      .from('project_shares')
      .update({ current_views: (shareData.current_views || 0) + 1 })
      .eq('id', shareData.id)

    if (incrementError) {
      console.warn('⚠️ Warning incrementing views:', incrementError.message)
    }

    // Return the shared project data
    const response = {
      share: {
        id: shareData.id,
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
      },
      project: {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        userId: projectData.user_id,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at
      }
    }

    console.log('✅ Successfully fetched shared project')

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Unexpected error in shared project API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 