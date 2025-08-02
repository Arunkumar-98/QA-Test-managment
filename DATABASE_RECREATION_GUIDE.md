# Database Recreation Guide

## Problem
After implementing the position fix, the backend is broken because some database functions and tables might be missing or corrupted.

## Solution
We need to recreate the entire database schema from scratch using the complete SQL script.

## Method 1: Manual SQL Execution (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Make sure you're in the correct project

### Step 2: Apply the Complete Schema
1. Copy the entire contents of `complete-qa-system-schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 3: Verify the Setup
After running the script, you should see verification results showing:
- ✅ Tables created successfully (13 tables)
- ✅ Functions created successfully (4 functions)
- ✅ Constraints created successfully (1 constraint)

## Method 2: API Route (If Available)

If the `exec_sql` function exists in your database:

```bash
curl -X POST http://localhost:3001/api/recreate-database
```

## What the Script Does

### 1. Creates All Tables
- `projects` - Project management
- `test_cases` - Test cases with position field
- `test_suites` - Test suite management
- `documents` - Document storage
- `important_links` - Important links
- `platforms` - Platform definitions
- `app_settings` - Application settings
- `comments` - Test case comments
- `test_case_relationships` - Test case relationships
- `saved_filters` - Saved search filters
- `status_history` - Status change history
- `project_shares` - Project sharing
- `test_suite_shares` - Test suite sharing

### 2. Creates All Functions
- `insert_test_case_with_next_position` - Atomic test case insertion
- `delete_test_case_and_reorder` - Delete and reorder test cases
- `reorder_test_cases` - Reorder test cases
- `update_updated_at_column` - Update timestamp trigger

### 3. Sets Up Security
- Row Level Security (RLS) enabled on all tables
- Public access policies for demo purposes
- Proper foreign key constraints

### 4. Creates Indexes
- Performance indexes on frequently queried columns
- Position-based indexes for efficient ordering

### 5. Adds Sample Data
- Default project
- Common platforms (Web, Mobile, Desktop, API)

## Verification

After running the script, verify everything works:

```sql
-- Check tables
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
    'projects', 'test_cases', 'test_suites', 'documents', 
    'important_links', 'platforms', 'app_settings', 'comments',
    'test_case_relationships', 'saved_filters', 'status_history',
    'project_shares', 'test_suite_shares'
);

-- Check functions
SELECT COUNT(*) as function_count FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name IN (
    'insert_test_case_with_next_position',
    'delete_test_case_and_reorder',
    'reorder_test_cases',
    'update_updated_at_column'
);

-- Check constraints
SELECT COUNT(*) as constraint_count FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' AND constraint_name = 'unique_position_per_project';
```

## Expected Results
- **Tables**: 13
- **Functions**: 4
- **Constraints**: 1

## Troubleshooting

### If you get errors:
1. **Permission errors**: Make sure you have admin access to the database
2. **Function already exists**: The script uses `CREATE OR REPLACE` so this should be fine
3. **Table already exists**: The script uses `CREATE TABLE IF NOT EXISTS` so this should be fine

### If tables are missing:
1. Check if the script ran completely
2. Look for any error messages in the SQL Editor
3. Try running the script in smaller chunks

### If functions are missing:
1. Check if the `exec_sql` function exists
2. Try running the function creation statements manually
3. Verify you have the necessary permissions

## After Recreation

Once the database is recreated:

1. **Test the application**: Try creating, editing, and deleting test cases
2. **Test position functionality**: Verify that test cases get proper positions
3. **Test bulk operations**: Try importing multiple test cases
4. **Check authentication**: Verify that auth still works properly

## Backup (Optional)

Before running the recreation script, you might want to backup your current data:

```sql
-- Export current data (if any)
SELECT * FROM test_cases;
SELECT * FROM projects;
SELECT * FROM test_suites;
-- ... etc for other tables
```

## Notes

- This script is **idempotent** - it can be run multiple times safely
- It uses `IF NOT EXISTS` and `CREATE OR REPLACE` to avoid conflicts
- All existing data will be preserved (if any)
- The script includes proper foreign key relationships
- Row Level Security is enabled but with public access for demo purposes 