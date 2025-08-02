-- Fix for race condition in test case position assignment
-- This function atomically gets the next available position and inserts the test case

-- Create a function to atomically insert test case with next available position
CREATE OR REPLACE FUNCTION insert_test_case_with_next_position(
    p_test_case_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_test_case_id UUID;
    v_next_position INTEGER;
    v_project_id UUID;
    v_result JSONB;
BEGIN
    -- Extract project_id from the test case data
    v_project_id := (p_test_case_data->>'project_id')::UUID;
    
    -- Get the next available position atomically
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM test_cases 
    WHERE project_id = v_project_id;
    
    -- Insert the test case with the calculated position
    INSERT INTO test_cases (
        test_case,
        description,
        expected_result,
        status,
        priority,
        category,
        assigned_tester,
        execution_date,
        notes,
        actual_result,
        environment,
        prerequisites,
        platform,
        steps_to_reproduce,
        project_id,
        suite_id,
        position,
        automation_script,
        created_at,
        updated_at
    )
    VALUES (
        p_test_case_data->>'test_case',
        p_test_case_data->>'description',
        p_test_case_data->>'expected_result',
        (p_test_case_data->>'status')::text,
        (p_test_case_data->>'priority')::text,
        (p_test_case_data->>'category')::text,
        p_test_case_data->>'assigned_tester',
        p_test_case_data->>'execution_date',
        p_test_case_data->>'notes',
        p_test_case_data->>'actual_result',
        p_test_case_data->>'environment',
        p_test_case_data->>'prerequisites',
        p_test_case_data->>'platform',
        p_test_case_data->>'steps_to_reproduce',
        v_project_id,
        (p_test_case_data->>'suite_id')::UUID,
        v_next_position,
        p_test_case_data->'automation_script',
        (p_test_case_data->>'created_at')::timestamp with time zone,
        (p_test_case_data->>'updated_at')::timestamp with time zone
    )
    RETURNING to_jsonb(test_cases.*) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Also create a function to fix any existing duplicate positions
CREATE OR REPLACE FUNCTION fix_existing_duplicate_positions()
RETURNS VOID AS $$
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
        
        RAISE NOTICE 'Fixed positions for project %: % test cases reordered', 
            project_record.project_id, new_position - 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix for any existing duplicates
SELECT fix_existing_duplicate_positions();

-- Drop the temporary function
DROP FUNCTION fix_existing_duplicate_positions(); 