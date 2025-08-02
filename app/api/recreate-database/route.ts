import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting complete database recreation...')

    // Read the complete schema file
    const fs = require('fs')
    const path = require('path')
    
    const schemaPath = path.join(process.cwd(), 'complete-qa-system-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    console.log('📄 Schema file loaded, applying to database...')

    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Execute each statement
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          })
          
          if (error) {
            console.error('Error executing statement:', error)
            errorCount++
            errors.push(`Statement failed: ${error.message}`)
          } else {
            successCount++
          }
        }
      } catch (err) {
        console.error('Error executing statement:', err)
        errorCount++
        errors.push(`Statement failed: ${err}`)
      }
    }

    console.log(`✅ Database recreation completed. Success: ${successCount}, Errors: ${errorCount}`)

    // Verify the recreation
    const verificationResults = await verifyDatabaseSetup()

    return NextResponse.json({
      success: true,
      message: 'Database recreation completed',
      results: {
        statementsExecuted: successCount,
        errors: errorCount,
        errorDetails: errors,
        verification: verificationResults
      }
    })

  } catch (error) {
    console.error('❌ Error in database recreation:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function verifyDatabaseSetup() {
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'projects', 'test_cases', 'test_suites', 'documents', 
        'important_links', 'platforms', 'app_settings', 'comments',
        'test_case_relationships', 'saved_filters', 'status_history',
        'project_shares', 'test_suite_shares'
      ])

    // Check if functions exist
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', [
        'insert_test_case_with_next_position',
        'delete_test_case_and_reorder',
        'reorder_test_cases',
        'update_updated_at_column'
      ])

    // Check if constraints exist
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('constraint_schema', 'public')
      .eq('constraint_name', 'unique_position_per_project')

    return {
      tables: tables?.length || 0,
      functions: functions?.length || 0,
      constraints: constraints?.length || 0,
      errors: {
        tables: tablesError?.message,
        functions: functionsError?.message,
        constraints: constraintsError?.message
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 