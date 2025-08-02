-- Atomic bulk deletion function to prevent position conflicts
CREATE OR REPLACE FUNCTION bulk_delete_test_cases(
    p_test_case_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    v_test_case RECORD;
    v_project_id UUID;
    v_position INTEGER;
    v_test_case_ids_sorted UUID[];
BEGIN
    -- Get all test cases to be deleted, ordered by project and position
    SELECT array_agg(id ORDER BY project_id, position DESC) INTO v_test_case_ids_sorted
    FROM test_cases 
    WHERE id = ANY(p_test_case_ids);
    
    -- Process each test case in reverse position order within each project
    FOR v_test_case IN 
        SELECT id, project_id, position
        FROM test_cases 
        WHERE id = ANY(v_test_case_ids_sorted)
        ORDER BY project_id, position DESC
    LOOP
        -- Delete the test case
        DELETE FROM test_cases WHERE id = v_test_case.id;
        
        -- Update positions of remaining test cases in the same project
        UPDATE test_cases 
        SET position = position - 1
        WHERE project_id = v_test_case.project_id 
        AND position > v_test_case.position;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 