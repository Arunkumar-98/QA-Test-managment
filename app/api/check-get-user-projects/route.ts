import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing get_user_projects function...')
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test the get_user_projects function
    const { data, error } = await supabase.rpc('get_user_projects')
    
    if (error) {
      console.error('❌ get_user_projects function error:', error)
      return NextResponse.json({ 
        success: false, 
        functionExists: false,
        error: 'Function failed',
        details: error 
      })
    }
    
    console.log('✅ get_user_projects function works:', data)
    
    return NextResponse.json({ 
      success: true, 
      functionExists: true,
      message: 'get_user_projects function works correctly',
      data: data 
    })
    
  } catch (error) {
    console.error('❌ Error testing get_user_projects:', error)
    return NextResponse.json({ 
      success: false, 
      functionExists: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 