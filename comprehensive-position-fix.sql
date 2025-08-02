-- Comprehensive fix for test case position constraint issues
-- This script addresses the "unique_position_per_project" constraint violation

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

-- Step 3: Re-add the constraint
ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
UNIQUE (project_id, position);

-- Step 4: Replace the delete function with the improved version
CREATE OR REPLACE FUNCTION delete_test_case_and_reorder(
    p_test_case_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_position INTEGER;
    v_count INTEGER;
BEGIN
    -- Get the project_id and position of the test case to delete
    SELECT project_id, position INTO v_project_id, v_position
    FROM test_cases 
    WHERE id = p_test_case_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Test case not found with ID: %', p_test_case_id;
    END IF;
    
    -- Check if there are any test cases with the same position in this project
    SELECT COUNT(*) INTO v_count
    FROM test_cases 
    WHERE project_id = v_project_id 
    AND position = v_position;
    
    IF v_count > 1 THEN
        -- If there are duplicates, fix them first
        RAISE NOTICE 'Found % test cases with position % in project %. Fixing duplicates...', 
            v_count, v_position, v_project_id;
        
        -- Reorder all test cases in this project to fix duplicates
        WITH ordered_test_cases AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_position
            FROM test_cases 
            WHERE project_id = v_project_id
            AND id != p_test_case_id
        )
        UPDATE test_cases 
        SET position = ordered_test_cases.new_position
        FROM ordered_test_cases
        WHERE test_cases.id = ordered_test_cases.id;
    ELSE
        -- Normal case: just shift remaining test cases up
        UPDATE test_cases 
        SET position = position - 1
        WHERE project_id = v_project_id 
        AND position > v_position;
    END IF;
    
    -- Delete the test case
    DELETE FROM test_cases WHERE id = p_test_case_id;
    
    -- Verify no duplicates remain
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT position, COUNT(*) as cnt
        FROM test_cases 
        WHERE project_id = v_project_id
        GROUP BY position
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_count > 0 THEN
        RAISE WARNING 'Duplicate positions still exist after deletion. Manual intervention may be required.';
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add comment for documentation
COMMENT ON FUNCTION delete_test_case_and_reorder IS 'Deletes a test case and reorders remaining ones, with improved duplicate handling';

-- Step 6: Verify the fix
SELECT 
    'Position fix completed!' as status,
    COUNT(*) as total_test_cases,
    COUNT(position) as test_cases_with_position,
    COUNT(DISTINCT (project_id, position)) as unique_project_position_combinations
FROM test_cases;

-- Step 7: Check for any remaining duplicates (should return no rows)
SELECT 
    project_id,
    position,
    COUNT(*) as duplicate_count
FROM test_cases 
WHERE project_id IS NOT NULL 
GROUP BY project_id, position 
HAVING COUNT(*) > 1; 