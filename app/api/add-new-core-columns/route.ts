import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tbutffculjesqiodwxsh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Adding new core columns to test_cases table...')

    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service role key not available' 
      }, { status: 500 })
    }

    // SQL to add new core columns
    const sql = `
      ALTER TABLE test_cases 
      ADD COLUMN IF NOT EXISTS qa_status VARCHAR(50) DEFAULT 'Not Started',
      ADD COLUMN IF NOT EXISTS dev_status VARCHAR(50) DEFAULT 'Not Started',
      ADD COLUMN IF NOT EXISTS assigned_dev VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS bug_status VARCHAR(50) DEFAULT 'Open',
      ADD COLUMN IF NOT EXISTS test_type VARCHAR(50) DEFAULT 'Manual',
      ADD COLUMN IF NOT EXISTS test_level VARCHAR(50) DEFAULT 'System',
      ADD COLUMN IF NOT EXISTS defect_severity VARCHAR(50) DEFAULT 'Medium',
      ADD COLUMN IF NOT EXISTS defect_priority VARCHAR(10) DEFAULT 'P3',
      ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS actual_time INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS test_data TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS reviewer VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS review_date VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `

    // Try to run the SQL using a simple query to test if columns exist
    try {
      // First, let's check if the columns already exist
      const { data: existingColumns, error: checkError } = await supabase
        .from('test_cases')
        .select('qa_status, dev_status, assigned_dev')
        .limit(1)

      if (checkError && checkError.message.includes('column "qa_status" does not exist')) {
        console.log('⚠️ New columns do not exist, manual migration required')
        return NextResponse.json({
          success: false,
          error: 'Manual database migration required',
          details: 'The new core columns need to be added manually to the test_cases table.',
          sql: sql,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL from the "sql" field above',
            '4. Execute the SQL',
            '5. Refresh this page'
          ]
        }, { status: 400 })
      }

      if (checkError) {
        throw checkError
      }

      console.log('✅ New core columns already exist in test_cases table')
      return NextResponse.json({
        success: true,
        message: 'New core columns already exist in test_cases table'
      })

    } catch (error: any) {
      console.error('❌ Error checking/adding new core columns:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to add new core columns',
        details: error.message,
        sql: sql,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor', 
          '3. Copy and paste the SQL from the "sql" field above',
          '4. Execute the SQL',
          '5. Refresh this page'
        ]
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Error in add-new-core-columns:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 })
  }
}
