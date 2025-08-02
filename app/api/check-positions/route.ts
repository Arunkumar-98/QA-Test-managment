import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking test case positions...')

    // Check for duplicate positions
    const { data: duplicates, error: duplicatesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            project_id,
            position,
            COUNT(*) as duplicate_count
          FROM test_cases 
          WHERE project_id IS NOT NULL 
          GROUP BY project_id, position 
          HAVING COUNT(*) > 1
          ORDER BY project_id, position;
        `
      })

    // Get total test case count
    const { count: totalTestCases, error: countError } = await supabase
      .from('test_cases')
      .select('*', { count: 'exact', head: true })

    // Get test cases with null positions
    const { data: nullPositions, error: nullError } = await supabase
      .from('test_cases')
      .select('id, project_id, position')
      .is('position', null)

    // Get sample of test cases to see position distribution
    const { data: sampleTestCases, error: sampleError } = await supabase
      .from('test_cases')
      .select('id, project_id, position, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (duplicatesError || countError || nullError || sampleError) {
      console.error('Error checking positions:', { duplicatesError, countError, nullError, sampleError })
      return NextResponse.json({
        error: 'Failed to check positions',
        details: { duplicatesError, countError, nullError, sampleError }
      }, { status: 500 })
    }

    console.log('✅ Position check completed')

    return NextResponse.json({
      success: true,
      data: {
        totalTestCases,
        duplicates: duplicates || [],
        nullPositions: nullPositions || [],
        sampleTestCases: sampleTestCases || [],
        hasIssues: (duplicates && duplicates.length > 0) || (nullPositions && nullPositions.length > 0)
      }
    })

  } catch (error) {
    console.error('Error checking positions:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 