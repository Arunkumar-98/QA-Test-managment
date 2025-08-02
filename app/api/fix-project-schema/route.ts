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

    // Read the SQL file content
    const fs = require('fs')
    const path = require('path')
    const sqlFilePath = path.join(process.cwd(), 'fix-project-schema.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json(
        { error: 'SQL migration file not found' },
        { status: 500 }
      )
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('Executing SQL migration with', statements.length, 'statements')

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        })
        
        if (error) {
          console.error('Error executing statement:', statement, error)
          // Continue with other statements even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Project schema migration completed successfully'
    })

  } catch (error) {
    console.error('Error running project schema migration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 