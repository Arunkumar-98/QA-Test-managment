import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Create shared_project_references table using direct SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shared_project_references (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        original_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        original_project_name TEXT NOT NULL,
        share_token TEXT NOT NULL,
        permissions JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, original_project_id)
      );
    `

    const { error: createTableError } = await supabase.from('shared_project_references').select('id').limit(1)
    
    if (createTableError && createTableError.message.includes('relation "shared_project_references" does not exist')) {
      // Table doesn't exist, we need to create it manually
      console.log('Table does not exist, creating it manually...')
      return NextResponse.json({
        success: false,
        message: 'Table creation requires manual setup. Please run the SQL script manually in your Supabase dashboard.',
        sql: createTableSQL
      })
    }

    if (createTableError) {
      console.error('Error creating shared_project_references table:', createTableError)
      return NextResponse.json(
        { error: `Failed to create shared_project_references table: ${createTableError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Live sync schema setup completed successfully'
    })

  } catch (error) {
    console.error('Error setting up live sync schema:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 