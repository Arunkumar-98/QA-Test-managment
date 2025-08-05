import { NextRequest, NextResponse } from 'next/server'
import { testSuiteService, testCaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { projectId, suiteId } = await request.json()
    
    if (!projectId || !suiteId) {
      return NextResponse.json({
        error: 'Project ID and Suite ID are required'
      }, { status: 400 })
    }

    // Get test cases before deletion to see which ones belong to the suite
    const testCasesBefore = await testCaseService.getAll(projectId)
    const testCasesInSuite = testCasesBefore.filter(tc => tc.suiteId === suiteId)
    
    console.log(`Found ${testCasesInSuite.length} test cases in suite ${suiteId}`)

    // Delete the test suite
    await testSuiteService.delete(suiteId)

    // Get test cases after deletion to verify suite_id was cleared
    const testCasesAfter = await testCaseService.getAll(projectId)
    const testCasesWithClearedSuite = testCasesAfter.filter(tc => 
      testCasesInSuite.some(originalTc => originalTc.id === tc.id && !tc.suiteId)
    )

    return NextResponse.json({
      success: true,
      message: 'Test suite deleted successfully',
      testCasesInSuiteBefore: testCasesInSuite.length,
      testCasesWithClearedSuite: testCasesWithClearedSuite.length,
      allTestCasesAfter: testCasesAfter.length,
      verification: testCasesInSuite.length === testCasesWithClearedSuite.length ? 'PASSED' : 'FAILED'
    })
  } catch (error) {
    console.error('Error testing test suite deletion:', error)
    return NextResponse.json({
      error: 'Failed to test test suite deletion',
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

    // Get all test cases and their suite assignments
    const testCases = await testCaseService.getAll(projectId)
    const testSuites = await testSuiteService.getAll(projectId)

    const testCasesBySuite = testCases.reduce((acc, tc) => {
      const suiteId = tc.suiteId || 'no-suite'
      if (!acc[suiteId]) {
        acc[suiteId] = []
      }
      acc[suiteId].push(tc)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      totalTestCases: testCases.length,
      totalTestSuites: testSuites.length,
      testCasesBySuite,
      testSuites: testSuites.map(ts => ({
        id: ts.id,
        name: ts.name,
        testCaseCount: ts.testCaseIds?.length || 0
      }))
    })
  } catch (error) {
    console.error('Error getting test cases and suites:', error)
    return NextResponse.json({
      error: 'Failed to get test cases and suites',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 