import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting position fix...')

    // Fix duplicate position values in test_cases table
    const { error: positionFixError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Temporarily disable the constraint to allow fixing
        ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS unique_position_per_project;
        
        -- Fix all duplicate positions by reordering test cases within each project
        DO $$
        DECLARE
            project_record RECORD;
            test_case_record RECORD;
            new_position INTEGER;
        BEGIN
            -- Loop through each project
            FOR project_record IN 
                SELECT DISTINCT project_id FROM test_cases WHERE project_id IS NOT NULL
            LOOP
                new_position := 1;
                
                -- Update positions for each test case in the project, ordered by created_at
                FOR test_case_record IN 
                    SELECT id FROM test_cases 
                    WHERE project_id = project_record.project_id 
                    ORDER BY created_at ASC
                LOOP
                    UPDATE test_cases 
                    SET position = new_position 
                    WHERE id = test_case_record.id;
                    
                    new_position := new_position + 1;
                END LOOP;
            END LOOP;
        END $$;
        
        -- Re-add the constraint
        ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
        UNIQUE (project_id, position);
      `
    })
    
    if (positionFixError) {
      console.error('Error fixing positions:', positionFixError)
      return NextResponse.json({
        error: 'Failed to fix positions',
        details: positionFixError.message
      }, { status: 500 })
    }

    console.log('✅ Position fix completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Position constraints fixed successfully. You should now be able to delete test cases.'
    })

  } catch (error) {
    console.error('Error applying position fix:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to apply position fix',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 