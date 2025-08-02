-- Fix missing columns in test_cases table
-- This script adds the missing automation_script and position columns

-- Step 1: Add automation_script column
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS automation_script JSONB;

-- Step 2: Add position column (if not already added by previous script)
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS position INTEGER;

-- Step 3: Update existing records with sequential positions based on created_at
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

-- Step 4: Make position required for new records
ALTER TABLE test_cases ALTER COLUMN position SET NOT NULL;

-- Step 5: Add unique constraint to ensure no duplicate positions within the same project
-- First drop the constraint if it exists to avoid errors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_position_per_project' 
        AND table_name = 'test_cases'
    ) THEN
        ALTER TABLE test_cases DROP CONSTRAINT unique_position_per_project;
    END IF;
END $$;

-- Now add the constraint
ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project
UNIQUE (project_id, position);

-- Step 6: Create an index for better performance on position queries
CREATE INDEX IF NOT EXISTS idx_test_cases_position ON test_cases(project_id, position);

-- Step 7: Verify the changes
SELECT 
    'Columns added successfully!' as status,
    COUNT(*) as total_test_cases,
    COUNT(position) as test_cases_with_position,
    COUNT(automation_script) as test_cases_with_automation
FROM test_cases; 