-- Fix User Isolation - Add user_id to all tables and enable RLS
-- This ensures each user only sees their own data

-- =====================================================
-- 1. ADD USER_ID COLUMNS TO ALL TABLES
-- =====================================================

-- Add user_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to test_cases table  
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to test_suites table
ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to important_links table
ALTER TABLE important_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to status_history table
ALTER TABLE status_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to saved_filters table
ALTER TABLE saved_filters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to project_shares table
ALTER TABLE project_shares ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to test_suite_shares table
ALTER TABLE test_suite_shares ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- 2. UPDATE EXISTING RECORDS (if any)
-- =====================================================

-- For now, we'll set existing records to a default user
-- In production, you'd want to migrate existing data properly
-- UPDATE projects SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE test_cases SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- etc...

-- =====================================================
-- 3. MAKE USER_ID NOT NULL (after migration)
-- =====================================================

-- ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE test_cases ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE test_suites ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE important_links ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE comments ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE status_history ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE saved_filters ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE project_shares ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE test_suite_shares ALTER COLUMN user_id SET NOT NULL;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suite_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Test Cases policies
DROP POLICY IF EXISTS "Users can view own test cases" ON test_cases;
CREATE POLICY "Users can view own test cases" ON test_cases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own test cases" ON test_cases;
CREATE POLICY "Users can insert own test cases" ON test_cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own test cases" ON test_cases;
CREATE POLICY "Users can update own test cases" ON test_cases
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own test cases" ON test_cases;
CREATE POLICY "Users can delete own test cases" ON test_cases
  FOR DELETE USING (auth.uid() = user_id);

-- Test Suites policies
DROP POLICY IF EXISTS "Users can view own test suites" ON test_suites;
CREATE POLICY "Users can view own test suites" ON test_suites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own test suites" ON test_suites;
CREATE POLICY "Users can insert own test suites" ON test_suites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own test suites" ON test_suites;
CREATE POLICY "Users can update own test suites" ON test_suites
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own test suites" ON test_suites;
CREATE POLICY "Users can delete own test suites" ON test_suites
  FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON documents;
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Important Links policies
DROP POLICY IF EXISTS "Users can view own important links" ON important_links;
CREATE POLICY "Users can view own important links" ON important_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own important links" ON important_links;
CREATE POLICY "Users can insert own important links" ON important_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own important links" ON important_links;
CREATE POLICY "Users can update own important links" ON important_links
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own important links" ON important_links;
CREATE POLICY "Users can delete own important links" ON important_links
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can view own comments" ON comments;
CREATE POLICY "Users can view own comments" ON comments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Status History policies
DROP POLICY IF EXISTS "Users can view own status history" ON status_history;
CREATE POLICY "Users can view own status history" ON status_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own status history" ON status_history;
CREATE POLICY "Users can insert own status history" ON status_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved Filters policies
DROP POLICY IF EXISTS "Users can view own saved filters" ON saved_filters;
CREATE POLICY "Users can view own saved filters" ON saved_filters
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved filters" ON saved_filters;
CREATE POLICY "Users can insert own saved filters" ON saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved filters" ON saved_filters;
CREATE POLICY "Users can update own saved filters" ON saved_filters
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved filters" ON saved_filters;
CREATE POLICY "Users can delete own saved filters" ON saved_filters
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE INDEXES FOR USER_ID
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_user_id ON test_suites(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_important_links_user_id ON important_links(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_user_id ON project_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_shares_user_id ON test_suite_shares(user_id);

-- =====================================================
-- 7. UPDATE FUNCTIONS TO INCLUDE USER_ID
-- =====================================================

-- Update the insert function to include user_id
CREATE OR REPLACE FUNCTION insert_test_case_with_next_position(
    p_test_case_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_next_position INTEGER;
    v_inserted_record JSONB;
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- Get the next position for the project
    SELECT COALESCE(MAX(position), 0) + 1
    INTO v_next_position
    FROM test_cases
    WHERE project_id = (p_test_case_data->>'project_id')::UUID
    AND user_id = v_user_id;
    
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
        user_id,
        created_at,
        updated_at
    )
    VALUES (
        p_test_case_data->>'test_case',
        p_test_case_data->>'description',
        p_test_case_data->>'expected_result',
        p_test_case_data->>'status',
        p_test_case_data->>'priority',
        p_test_case_data->>'category',
        p_test_case_data->>'assigned_tester',
        p_test_case_data->>'execution_date',
        p_test_case_data->>'notes',
        p_test_case_data->>'actual_result',
        p_test_case_data->>'environment',
        p_test_case_data->>'prerequisites',
        p_test_case_data->>'platform',
        p_test_case_data->>'steps_to_reproduce',
        (p_test_case_data->>'project_id')::UUID,
        CASE 
            WHEN p_test_case_data->>'suite_id' IS NULL OR p_test_case_data->>'suite_id' = '' 
            THEN NULL 
            ELSE (p_test_case_data->>'suite_id')::UUID 
        END,
        v_next_position,
        p_test_case_data->'automation_script',
        v_user_id,
        NOW(),
        NOW()
    )
    RETURNING to_jsonb(test_cases.*) INTO v_inserted_record;
    
    RETURN v_inserted_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 