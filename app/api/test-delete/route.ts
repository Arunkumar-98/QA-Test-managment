import { NextRequest, NextResponse } from 'next/server'
import { testCaseService } from '@/lib/supabase-service'

export async function GET() {
  try {
    console.log('🧪 Testing test case deletion...')
    
    // First, create a test case to delete
    const testCase = await testCaseService.create({
      testCase: 'Test Case for Deletion',
      description: 'This test case will be deleted',
      status: 'Pending',
      priority: 'Medium',
      category: 'Test',
      projectId: 'eca23d4f-4469-4b31-9355-ca0e743f7a88', // Use the project from earlier
      platform: 'Web'
    })
    
    console.log('✅ Created test case for deletion:', testCase.id)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Now delete it
    await testCaseService.delete(testCase.id)
    
    console.log('✅ Successfully deleted test case:', testCase.id)
    
    return NextResponse.json({ 
      success: true,
      message: 'Test case deletion works correctly',
      createdAndDeletedId: testCase.id
    })
    
  } catch (error) {
    console.error('❌ Test case deletion failed:', error)
    return NextResponse.json({ 
      error: 'Test case deletion failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 