import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Testing delete_test_case_and_reorder function...')
    
    // Get a test case to delete
    const { data: testCases, error: queryError } = await supabase
      .from('test_cases')
      .select('id, test_case, position, project_id')
      .limit(1)
    
    if (queryError || !testCases || testCases.length === 0) {
      return NextResponse.json({ 
        error: 'No test cases found to test with',
        details: queryError 
      }, { status: 400 })
    }
    
    const testCase = testCases[0]
    console.log('📝 Test case to delete:', testCase)
    
    // Try to call the delete function
    const { data: result, error: deleteError } = await supabase.rpc('delete_test_case_and_reorder', {
      p_test_case_id: testCase.id
    })
    
    if (deleteError) {
      console.error('❌ Delete function test failed:', deleteError)
      return NextResponse.json({ 
        error: 'Delete function does not exist or failed',
        functionExists: false,
        details: deleteError,
        testCase
      }, { status: 404 })
    }
    
    console.log('✅ Delete function test successful:', result)
    
    return NextResponse.json({ 
      success: true,
      functionExists: true,
      message: 'Delete function exists and works correctly',
      testResult: result,
      deletedTestCase: testCase
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error 
    }, { status: 500 })
  }
} 