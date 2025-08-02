-- Temporary fix: Disable constraint during bulk operations
-- WARNING: This should only be used temporarily and with caution

-- Step 1: Disable the constraint
ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS unique_position_per_project;

-- Step 2: Perform your bulk deletion operations here
-- (Your application will handle the deletion without constraint violations)

-- Step 3: Re-enable the constraint and fix any duplicates
DO $$
DECLARE
    v_project RECORD;
    v_test_case RECORD;
    v_position INTEGER;
BEGIN
    -- For each project, reorder test cases by created_at
    FOR v_project IN SELECT DISTINCT project_id FROM test_cases ORDER BY project_id LOOP
        v_position := 1;
        
        FOR v_test_case IN 
            SELECT id 
            FROM test_cases 
            WHERE project_id = v_project.project_id 
            ORDER BY created_at
        LOOP
            UPDATE test_cases 
            SET position = v_position 
            WHERE id = v_test_case.id;
            
            v_position := v_position + 1;
        END LOOP;
    END LOOP;
END $$;

-- Step 4: Re-add the constraint
ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
UNIQUE (project_id, position); 