import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔒 Starting user isolation fix...')
    
    // Read the SQL script
    const sqlPath = join(process.cwd(), 'fix-user-isolation.sql')
    const sqlScript = readFileSync(sqlPath, 'utf8')
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.error('❌ Error applying user isolation fix:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to apply user isolation fix',
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ User isolation fix applied successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'User isolation fix applied successfully. Each user will now only see their own data.' 
    })
    
  } catch (error) {
    console.error('❌ Error in fix-user-isolation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 