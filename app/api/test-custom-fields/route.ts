import { NextRequest, NextResponse } from 'next/server'
import { testCaseService, customColumnService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { projectId, testCaseId, customFields } = await request.json()
    
    if (!projectId || !testCaseId) {
      return NextResponse.json({
        error: 'Project ID and Test Case ID are required'
      }, { status: 400 })
    }

    // Test updating custom fields
    if (customFields) {
      await testCaseService.update(testCaseId, { customFields })
    }

    // Get the updated test case
    const testCases = await testCaseService.getAll(projectId)
    const testCase = testCases.find(tc => tc.id === testCaseId)

    // Get custom columns for the project
    const customColumns = await customColumnService.getAll(projectId)

    return NextResponse.json({
      success: true,
      testCase,
      customColumns,
      message: 'Custom fields updated successfully'
    })
  } catch (error) {
    console.error('Error testing custom fields:', error)
    return NextResponse.json({
      error: 'Failed to test custom fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({
        error: 'Project ID is required'
      }, { status: 400 })
    }

    // Get test cases with custom fields
    const testCases = await testCaseService.getAll(projectId)
    
    // Get custom columns
    const customColumns = await customColumnService.getAll(projectId)

    return NextResponse.json({
      success: true,
      testCases: testCases.slice(0, 5), // Return first 5 for testing
      customColumns,
      totalTestCases: testCases.length,
      totalCustomColumns: customColumns.length
    })
  } catch (error) {
    console.error('Error getting test cases with custom fields:', error)
    return NextResponse.json({
      error: 'Failed to get test cases with custom fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 