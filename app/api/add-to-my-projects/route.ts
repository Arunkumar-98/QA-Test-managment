import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mapSharedProjectReferenceToDB } from '@/types/qa-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userToken = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get the shared project data
    const { data: shareData, error: shareError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()

    if (shareError || !shareData) {
      return NextResponse.json(
        { error: 'Invalid or expired share token' },
        { status: 404 }
      )
    }

    // Check if share has expired
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      )
    }

    // Get the original project
    const { data: originalProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', shareData.project_id)
      .single()

    if (projectError || !originalProject) {
      return NextResponse.json(
        { error: 'Original project not found' },
        { status: 404 }
      )
    }

    // Check if user already has a reference to this project
    const { data: existingReference } = await supabase
      .from('shared_project_references')
      .select('id')
      .eq('user_id', user.id)
      .eq('original_project_id', originalProject.id)
      .single()

    if (existingReference) {
      return NextResponse.json(
        { error: 'You already have this project in your shared projects' },
        { status: 409 }
      )
    }

    // Create a reference to the original project (not a copy)
    const referenceData = {
      user_id: user.id,
      original_project_id: originalProject.id,
      original_project_name: originalProject.name,
      share_token: token,
      permissions: shareData.permissions,
      created_at: new Date(),
      is_active: true,
      last_synced_at: new Date()
    }

    const { data: newReference, error: createReferenceError } = await supabase
      .from('shared_project_references')
      .insert([referenceData])
      .select()
      .single()

    if (createReferenceError) {
      console.error('Error creating project reference:', createReferenceError)
      return NextResponse.json(
        { error: `Failed to add project to your shared projects: ${createReferenceError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reference: newReference,
      message: 'Project added to your shared projects successfully. You will see live updates from the original project.'
    })

  } catch (error) {
    console.error('Error adding shared project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 