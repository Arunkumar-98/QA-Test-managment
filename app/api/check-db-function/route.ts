import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Testing insert_test_case_with_next_position function...')
    
    // Get a project ID to test with
    const { data: projectList, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    if (projectError || !projectList || projectList.length === 0) {
      return NextResponse.json({ 
        error: 'No projects found to test with',
        details: projectError 
      }, { status: 400 })
    }
    
    const testData = {
      test_case: 'Test Case for Function Test',
      description: 'Testing the atomic insert function',
      expected_result: 'Should work without race conditions',
      status: 'Pending',
      priority: 'Medium',
      category: 'Test',
      project_id: projectList[0].id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Test data:', testData)
    
    // Try to call the function directly
    const { data: result, error: testError } = await supabase.rpc('insert_test_case_with_next_position', {
      p_test_case_data: testData
    })
    
    if (testError) {
      console.error('❌ Function test failed:', testError)
      return NextResponse.json({ 
        error: 'Function does not exist or failed',
        functionExists: false,
        details: testError,
        testData
      }, { status: 404 })
    }
    
    console.log('✅ Function test successful:', result)
    
    // Clean up the test data
    if (result && result.id) {
      await supabase
        .from('test_cases')
        .delete()
        .eq('id', result.id)
    }
    
    return NextResponse.json({ 
      success: true,
      functionExists: true,
      message: 'Function exists and works correctly',
      testResult: result
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error 
    }, { status: 500 })
  }
} 