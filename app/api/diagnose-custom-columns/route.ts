import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnosing custom_columns table...')

    const results = {
      tableExists: false,
      canQuery: false,
      canInsert: false,
      rowCount: 0,
      queryError: null,
      insertError: null
    }

    // Test 1: Can we query the table?
    try {
      const { data: queryData, error: queryError } = await supabase
        .from('custom_columns')
        .select('*')
        .limit(1)
      
      if (queryError) {
        results.queryError = {
          message: queryError.message,
          code: queryError.code,
          details: queryError.details,
          hint: queryError.hint
        }
      } else {
        results.canQuery = true
        results.tableExists = true
      }
    } catch (queryTestError) {
      results.queryError = queryTestError instanceof Error ? queryTestError.message : 'Unknown query error'
    }

    // Test 2: Can we count rows?
    if (results.canQuery) {
      try {
        const { count, error: countError } = await supabase
          .from('custom_columns')
          .select('*', { count: 'exact', head: true })
        
        if (!countError) {
          results.rowCount = count || 0
        }
      } catch (countError) {
        console.log('Count test failed:', countError)
      }
    }

    // Test 3: Can we insert a test record?
    if (results.canQuery) {
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('custom_columns')
          .insert({
            name: 'test_diagnostic_column',
            label: 'Test Diagnostic Column',
            type: 'text',
            visible: true,
            width: 'w-32',
            min_width: 'min-w-[120px]',
            project_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            default_value: 'test',
            required: false
          })
          .select()
          .single()

        if (insertError) {
          results.insertError = {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          }
        } else {
          results.canInsert = true
          
          // Clean up the test record
          await supabase
            .from('custom_columns')
            .delete()
            .eq('id', insertData.id)
        }
      } catch (insertTestError) {
        results.insertError = insertTestError instanceof Error ? insertTestError.message : 'Unknown insert error'
      }
    }

    console.log('✅ Custom columns diagnosis complete:', results)

    return NextResponse.json({
      success: true,
      diagnosis: results,
      recommendation: results.canInsert 
        ? 'Database is working correctly'
        : results.canQuery 
          ? 'Table exists but insert failed - check column structure'
          : 'Table does not exist or cannot be accessed'
    })

  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
    return NextResponse.json({
      success: false,
      error: 'Diagnosis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}