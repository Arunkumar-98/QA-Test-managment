-- Fix duplicate position values in test_cases table
-- This script resolves the "unique_position_per_project" constraint violation

-- Function to fix duplicate positions within each project
CREATE OR REPLACE FUNCTION fix_duplicate_positions()
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
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix
SELECT fix_duplicate_positions();

-- Drop the temporary function
DROP FUNCTION fix_duplicate_positions();

-- Verify the fix by checking for any remaining duplicates
SELECT 
    project_id,
    position,
    COUNT(*) as duplicate_count
FROM test_cases 
WHERE project_id IS NOT NULL 
GROUP BY project_id, position 
HAVING COUNT(*) > 1;

-- If the above query returns no rows, the fix was successful
-- If it returns rows, there are still duplicates that need manual attention 