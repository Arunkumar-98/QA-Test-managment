-- Add position field to test_cases table for proper ordering
-- This is the proper solution instead of relying on localStorage

-- Step 1: Add the position column
ALTER TABLE test_cases ADD COLUMN position INTEGER;

-- Step 2: Update existing records with sequential positions based on created_at
-- This ensures existing test cases get logical positions
WITH numbered_test_cases AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY project_id 
            ORDER BY created_at ASC
        ) as new_position
    FROM test_cases
    WHERE position IS NULL
)
UPDATE test_cases 
SET position = numbered_test_cases.new_position
FROM numbered_test_cases
WHERE test_cases.id = numbered_test_cases.id;

-- Step 3: Make position required for new records
ALTER TABLE test_cases ALTER COLUMN position SET NOT NULL;

-- Step 4: Add unique constraint to ensure no duplicate positions within the same project
ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
UNIQUE (project_id, position);

-- Step 5: Create an index for better performance on position queries
CREATE INDEX idx_test_cases_position ON test_cases(project_id, position);

-- Step 6: Create a function to handle position reordering when test cases are moved
CREATE OR REPLACE FUNCTION reorder_test_cases(
    p_test_case_id UUID,
    p_new_position INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_old_position INTEGER;
BEGIN
    -- Get the project_id and current position of the test case
    SELECT project_id, position INTO v_project_id, v_old_position
    FROM test_cases 
    WHERE id = p_test_case_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Test case not found';
    END IF;
    
    -- If moving to the same position, do nothing
    IF v_old_position = p_new_position THEN
        RETURN;
    END IF;
    
    -- If moving to a higher position (down in the list)
    IF v_old_position < p_new_position THEN
        -- Shift other test cases down
        UPDATE test_cases 
        SET position = position - 1
        WHERE project_id = v_project_id 
        AND position > v_old_position 
        AND position <= p_new_position;
    ELSE
        -- If moving to a lower position (up in the list)
        -- Shift other test cases up
        UPDATE test_cases 
        SET position = position + 1
        WHERE project_id = v_project_id 
        AND position >= p_new_position 
        AND position < v_old_position;
    END IF;
    
    -- Update the target test case to the new position
    UPDATE test_cases 
    SET position = p_new_position
    WHERE id = p_test_case_id;
    
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a function to insert new test case at a specific position
CREATE OR REPLACE FUNCTION insert_test_case_at_position(
    p_test_case_data JSONB,
    p_position INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_test_case_id UUID;
    v_project_id UUID;
BEGIN
    -- Extract project_id from the test case data
    v_project_id := (p_test_case_data->>'project_id')::UUID;
    
    -- Shift existing test cases to make room for the new one
    UPDATE test_cases 
    SET position = position + 1
    WHERE project_id = v_project_id 
    AND position >= p_position;
    
    -- Insert the new test case with the specified position
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
        p_position,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_case_id;
    
    RETURN v_test_case_id;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create a function to delete test case and reorder remaining ones
CREATE OR REPLACE FUNCTION delete_test_case_and_reorder(
    p_test_case_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_position INTEGER;
BEGIN
    -- Get the project_id and position of the test case to delete
    SELECT project_id, position INTO v_project_id, v_position
    FROM test_cases 
    WHERE id = p_test_case_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Test case not found';
    END IF;
    
    -- Delete the test case
    DELETE FROM test_cases WHERE id = p_test_case_id;
    
    -- Shift remaining test cases up to fill the gap
    UPDATE test_cases 
    SET position = position - 1
    WHERE project_id = v_project_id 
    AND position > v_position;
    
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add comments for documentation
COMMENT ON COLUMN test_cases.position IS 'Position of the test case within its project (1-based ordering)';
COMMENT ON FUNCTION reorder_test_cases IS 'Moves a test case to a new position and reorders other test cases accordingly';
COMMENT ON FUNCTION insert_test_case_at_position IS 'Inserts a new test case at a specific position and shifts others';
COMMENT ON FUNCTION delete_test_case_and_reorder IS 'Deletes a test case and reorders remaining ones';

-- Step 10: Verify the setup
SELECT 
    'Position field added successfully!' as status,
    COUNT(*) as total_test_cases,
    COUNT(position) as test_cases_with_position
FROM test_cases; 