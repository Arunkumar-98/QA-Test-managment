import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Check if environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('📋 Environment Variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
    
    // Test 2: Try to connect to Supabase
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        environment: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseKey: supabaseKey ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }
    
    console.log('✅ Supabase connection successful')
    
    // Test 3: Check if we can read from test_cases table
    const { data: testCasesData, error: testCasesError } = await supabase
      .from('test_cases')
      .select('count')
      .limit(1)
    
    if (testCasesError) {
      console.error('❌ Test cases table access failed:', testCasesError)
      return NextResponse.json({
        success: false,
        error: 'Database tables not accessible',
        details: testCasesError.message,
        connection: '✅ Connected',
        tables: '❌ Not accessible'
      }, { status: 500 })
    }
    
    console.log('✅ Database tables accessible')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection is working perfectly!',
      environment: {
        supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
        supabaseKey: supabaseKey ? '✅ Set' : '❌ Missing'
      },
      connection: '✅ Connected',
      tables: '✅ Accessible',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 