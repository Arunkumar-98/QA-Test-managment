# Position Race Condition Fix

## Problem Description

The QA Management System was experiencing a PostgreSQL unique constraint violation error:

```
duplicate key value violates unique constraint "unique_position_per_project"
```

This error occurs when multiple test cases are created simultaneously (concurrently) and they all get assigned the same position value, violating the unique constraint that ensures no two test cases in the same project can have the same position.

## Root Cause

The issue was in the `testCaseService.create` method in `lib/supabase-service.ts`. The original logic was:

1. Query the database to get the highest position for a project
2. Add 1 to get the next position
3. Insert the test case with that position

This approach has a race condition:
- If two test cases are created at the same time, both might read the same maximum position value
- Both would calculate the same "next" position
- Both would try to insert with the same position, causing the constraint violation

## Solution

### 1. Atomic Position Assignment

The fix involves creating a database function that atomically:
1. Gets the next available position
2. Inserts the test case with that position

This prevents race conditions because the entire operation happens in a single database transaction.

### 2. Updated Code

The `testCaseService.create` method has been updated to use the new atomic function:

```typescript
// Before (race condition prone)
const { data: existingTestCases } = await supabase
  .from('test_cases')
  .select('position')
  .eq('project_id', testCase.projectId)
  .order('position', { ascending: false })
  .limit(1)

if (existingTestCases && existingTestCases.length > 0) {
  position = existingTestCases[0].position + 1
}

// After (race condition safe)
const { data, error } = await supabase.rpc('insert_test_case_with_next_position', {
  p_test_case_data: dbData
})
```

### 3. Database Function

The `insert_test_case_with_next_position` function handles the atomic operation:

```sql
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
    INSERT INTO test_cases (...)
    VALUES (...)
    RETURNING to_jsonb(test_cases.*) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

## How to Apply the Fix

### Option 1: Use the API Route (Recommended)

If your application is running, you can use the provided API route:

```bash
curl -X POST http://localhost:3000/api/fix-position-race-condition
```

### Option 2: Manual SQL Execution

If the API route doesn't work, run the SQL script directly in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `manual-position-fix.sql`
4. Execute the script

### Option 3: Step-by-step Manual Fix

1. **Fix existing duplicates:**
   ```sql
   -- Temporarily disable the constraint
   ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS unique_position_per_project;
   
   -- Reorder test cases by created_at
   -- (See manual-position-fix.sql for the complete script)
   
   -- Re-add the constraint
   ALTER TABLE test_cases ADD CONSTRAINT unique_position_per_project 
   UNIQUE (project_id, position);
   ```

2. **Create the atomic function:**
   ```sql
   -- (See manual-position-fix.sql for the complete function)
   ```

## Verification

After applying the fix, verify it worked by running:

```sql
-- Check for any remaining duplicates (should return 0 rows)
SELECT 
    project_id,
    position,
    COUNT(*) as duplicate_count
FROM test_cases 
WHERE project_id IS NOT NULL 
GROUP BY project_id, position 
HAVING COUNT(*) > 1
ORDER BY project_id, position;
```

## Prevention

The fix prevents future race conditions by:

1. **Atomic operations:** Position assignment and insertion happen in a single database transaction
2. **Database-level concurrency control:** PostgreSQL handles the locking automatically
3. **Consistent ordering:** Test cases are ordered by `created_at` timestamp

## Affected Operations

This fix affects all test case creation operations:

- Single test case creation
- Bulk import from CSV/Excel
- Test case generation from PRD
- Paste dialog imports
- Any other concurrent test case creation

## Testing

To test the fix:

1. Create multiple test cases simultaneously (e.g., through bulk import)
2. Verify no constraint violations occur
3. Check that positions are assigned correctly and sequentially

## Rollback

If you need to rollback the changes:

1. Drop the function:
   ```sql
   DROP FUNCTION IF EXISTS insert_test_case_with_next_position;
   ```

2. Revert the code changes in `lib/supabase-service.ts`

3. Note that this will reintroduce the race condition issue

## Support

If you encounter any issues with this fix, please:

1. Check the application logs for error messages
2. Verify the database function was created successfully
3. Ensure the constraint is properly re-added
4. Test with a small number of concurrent operations first 