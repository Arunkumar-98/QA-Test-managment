import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing position fix...')

    // Get all test cases with their positions
    const { data: testCases, error: testCasesError } = await supabase
      .from('test_cases')
      .select('id, project_id, position, created_at')
      .not('project_id', 'is', null)
      .order('project_id, position')

    if (testCasesError) {
      console.error('Error getting test cases:', testCasesError)
      return NextResponse.json({
        error: 'Failed to get test cases',
        details: testCasesError.message
      }, { status: 500 })
    }

    // Check for duplicates manually
    const positionMap = new Map<string, number>()
    const duplicates: any[] = []

    testCases.forEach(testCase => {
      const key = `${testCase.project_id}-${testCase.position}`
      if (positionMap.has(key)) {
        duplicates.push({
          project_id: testCase.project_id,
          position: testCase.position,
          test_case_id: testCase.id
        })
      } else {
        positionMap.set(key, 1)
      }
    })

    // Get statistics
    const projects = [...new Set(testCases.map(tc => tc.project_id))]
    const totalTestCases = testCases.length
    const uniquePositions = positionMap.size

    console.log('✅ Position fix test completed')

    return NextResponse.json({
      success: true,
      message: 'Position fix test completed',
      results: {
        totalTestCases,
        totalProjects: projects.length,
        uniquePositions,
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates,
        projects: projects.map(projectId => {
          const projectTestCases = testCases.filter(tc => tc.project_id === projectId)
          return {
            project_id: projectId,
            testCaseCount: projectTestCases.length,
            positions: projectTestCases.map(tc => tc.position).sort((a, b) => a - b)
          }
        })
      }
    })

  } catch (error) {
    console.error('❌ Error in position fix test:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 