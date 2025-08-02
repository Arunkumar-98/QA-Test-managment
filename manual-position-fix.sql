-- Manual Position Fix Script for Supabase Dashboard
-- Run this script directly in your Supabase SQL Editor

-- Step 1: Temporarily disable the constraint to allow fixing
ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS unique_position_per_project;

-- Step 2: Fix all duplicate positions by reordering test cases within each project
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
        
        RAISE NOTICE 'Fixed positions for project %: % test cases reordered', 
            project_record.project_id, new_position - 1;
    END LOOP;
END $$;

-- Step 3: Create the atomic insert function to prevent future race conditions
CREATE OR REPLACE FUNCTION insert_test_case_with_next_position(
    p_test_case_data JSONB
)
RETURNS JSONB AS $$
DECLARE
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

-- Step 4: Re-add the constraint
ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
UNIQUE (project_id, position);

-- Step 5: Verify the fix
SELECT 
    'Position fix completed successfully!' as status,
    COUNT(*) as total_test_cases,
    COUNT(DISTINCT project_id) as total_projects,
    COUNT(DISTINCT (project_id, position)) as unique_project_position_combinations
FROM test_cases 
WHERE project_id IS NOT NULL;

-- Step 6: Check for any remaining duplicates (should return 0 rows)
SELECT 
    project_id,
    position,
    COUNT(*) as duplicate_count
FROM test_cases 
WHERE project_id IS NOT NULL 
GROUP BY project_id, position 
HAVING COUNT(*) > 1
ORDER BY project_id, position; 