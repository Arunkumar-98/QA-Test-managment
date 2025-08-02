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

    // Add tags column to projects table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT \'{}\''
    })

    if (alterError) {
      console.error('Error adding tags column:', alterError)
      return NextResponse.json(
        { error: `Failed to add tags column: ${alterError.message}` },
        { status: 500 }
      )
    }

    // Add index for better performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags)'
    })

    if (indexError) {
      console.error('Error creating index:', indexError)
      // Don't fail the entire operation for index creation
    }

    // Update existing projects to have empty tags array
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: 'UPDATE projects SET tags = \'{}\' WHERE tags IS NULL'
    })

    if (updateError) {
      console.error('Error updating existing projects:', updateError)
      // Don't fail the entire operation for this update
    }

    return NextResponse.json({
      success: true,
      message: 'Tags column added successfully to projects table'
    })

  } catch (error) {
    console.error('Error adding tags column:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 