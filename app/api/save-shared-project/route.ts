import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Check if user already has a copy of this project
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', `${originalProject.name} (Shared Copy)`)
      .single()

    if (existingProject) {
      return NextResponse.json(
        { error: 'You already have a copy of this project' },
        { status: 409 }
      )
    }

    // Create new project for the user
    const newProjectData = {
      name: `${originalProject.name} (Shared Copy)`,
      description: originalProject.description || `Shared copy of ${originalProject.name}`,
      created_at: new Date(),
      is_active: true,
      user_id: user.id,
      tags: ['Shared Project'] // Add the shared project tag
    }

    const { data: newProject, error: createProjectError } = await supabase
      .from('projects')
      .insert([newProjectData])
      .select()
      .single()

    if (createProjectError) {
      console.error('Error creating project:', createProjectError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Get all test cases from the original project
    const { data: originalTestCases, error: testCasesError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('project_id', originalProject.id)
      .order('position', { ascending: true })

    if (testCasesError) {
      console.error('Error fetching test cases:', testCasesError)
      return NextResponse.json(
        { error: 'Failed to fetch test cases' },
        { status: 500 }
      )
    }

    // Copy all test cases to the new project
    if (originalTestCases && originalTestCases.length > 0) {
      const newTestCases = originalTestCases.map((testCase, index) => ({
        test_case: testCase.test_case,
        description: testCase.description,
        expected_result: testCase.expected_result,
        status: testCase.status,
        priority: testCase.priority,
        category: testCase.category,
        assigned_tester: testCase.assigned_tester,
        execution_date: testCase.execution_date,
        notes: testCase.notes,
        actual_result: testCase.actual_result,
        environment: testCase.environment,
        prerequisites: testCase.prerequisites,
        platform: testCase.platform,
        steps_to_reproduce: testCase.steps_to_reproduce,
        project_id: newProject.id,
        position: index + 1,
        created_at: new Date(),
        updated_at: new Date(),
        automation_script: testCase.automation_script
      }))

      const { error: insertTestCasesError } = await supabase
        .from('test_cases')
        .insert(newTestCases)

      if (insertTestCasesError) {
        console.error('Error copying test cases:', insertTestCasesError)
        // Don't fail the entire operation, just log the error
      }
    }

    // Get all test suites from the original project
    const { data: originalTestSuites, error: testSuitesError } = await supabase
      .from('test_suites')
      .select('*')
      .eq('project_id', originalProject.id)

    if (testSuitesError) {
      console.error('Error fetching test suites:', testSuitesError)
    } else if (originalTestSuites && originalTestSuites.length > 0) {
      // Copy test suites (without test case associations for now)
      const newTestSuites = originalTestSuites.map(testSuite => ({
        name: testSuite.name,
        description: testSuite.description,
        project_id: newProject.id,
        test_case_ids: [], // Will be empty as we can't easily map the IDs
        created_at: new Date(),
        updated_at: new Date(),
        last_run: testSuite.last_run,
        last_status: testSuite.last_status,
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        pending_tests: 0,
        estimated_duration: testSuite.estimated_duration,
        tags: [...(testSuite.tags || []), 'Shared Project'],
        owner: user.id,
        is_active: testSuite.is_active,
        user_id: user.id
      }))

      const { error: insertTestSuitesError } = await supabase
        .from('test_suites')
        .insert(newTestSuites)

      if (insertTestSuitesError) {
        console.error('Error copying test suites:', insertTestSuitesError)
      }
    }

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Project saved successfully to your account'
    })

  } catch (error) {
    console.error('Error saving shared project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 