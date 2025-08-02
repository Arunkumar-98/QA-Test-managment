-- Improved delete_test_case_and_reorder function with better error handling
-- This version is more robust and prevents duplicate position issues

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

-- Add comment for documentation
COMMENT ON FUNCTION delete_test_case_and_reorder IS 'Deletes a test case and reorders remaining ones, with improved duplicate handling'; 