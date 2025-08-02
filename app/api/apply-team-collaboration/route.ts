import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('👥 Starting team collaboration setup...')
    
    // Read the SQL script
    const sqlPath = join(process.cwd(), 'team-collaboration-schema.sql')
    const sqlScript = readFileSync(sqlPath, 'utf8')
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.error('❌ Error applying team collaboration schema:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to apply team collaboration schema',
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ Team collaboration schema applied successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Team collaboration system setup successfully! Users can now share projects and collaborate.' 
    })
    
  } catch (error) {
    console.error('❌ Error in apply-team-collaboration:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 